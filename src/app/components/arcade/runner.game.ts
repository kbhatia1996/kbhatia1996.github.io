export interface RunResult {
  score: number;
  dodged: number;
  jumps: number;
  seconds: number;
  won: boolean;
}

interface Obstacle {
  x: number;
  w: number;
  h: number;
  label: string;
  passed: boolean;
}

const W = 640;
const H = 220;
const GROUND = 180;
const GRAVITY = 2100;
const JUMP_V = -720;
const START_SPEED = 270;
const MAX_SPEED = 560;
const KINDS = [
  { label: 'BUG', w: 30, h: 30 },
  { label: 'TODO', w: 44, h: 26 },
  { label: 'SCOPE+', w: 52, h: 44 },
  { label: 'LEGACY', w: 40, h: 52 },
  { label: 'FRI 5PM', w: 58, h: 34 }
];
const GOLD = '#c9a96e';
const CREAM = '#f5f0e8';
const DANGER = '#e08a7a';

/** Endless-runner engine: Karan jumps over the things that derail projects. */
export class RunnerGame {
  static readonly GOAL = 12;

  best = 0;

  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private last = 0;
  private running = false;
  private y = 0;
  private vy = 0;
  private speed = START_SPEED;
  private distance = 0;
  private elapsed = 0;
  private jumps = 0;
  private dodged = 0;
  private obstacles: Obstacle[] = [];
  private nextGap = 300;
  private stars = Array.from({ length: 26 }, () => ({ x: Math.random() * W, y: Math.random() * 120, s: Math.random() * 1.6 + 0.4 }));

  constructor(
    private canvas: HTMLCanvasElement,
    private onEnd: (result: RunResult) => void,
    private reducedMotion: boolean
  ) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * ratio;
    canvas.height = H * ratio;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.scale(ratio, ratio);
    try {
      this.best = Number(localStorage.getItem('kb-runner-best')) || 0;
    } catch {
      this.best = 0;
    }
    this.draw('Press Space, ↑ or tap to run');
  }

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    this.y = 0;
    this.vy = 0;
    this.speed = START_SPEED;
    this.distance = 0;
    this.elapsed = 0;
    this.jumps = 0;
    this.dodged = 0;
    this.obstacles = [];
    this.nextGap = 320;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  jump(): void {
    if (!this.running) return;
    if (this.y === 0) {
      this.vy = JUMP_V;
      this.jumps++;
    }
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private tick = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.update(dt);
    if (this.running) {
      this.draw();
      this.raf = requestAnimationFrame(this.tick);
    }
  };

  private update(dt: number): void {
    this.elapsed += dt;
    this.speed = Math.min(MAX_SPEED, this.speed + 9 * dt);
    this.distance += this.speed * dt;

    this.vy += GRAVITY * dt;
    this.y = Math.min(0, this.y + this.vy * dt);
    if (this.y === 0) this.vy = 0;

    for (const o of this.obstacles) o.x -= this.speed * dt;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -20);

    const lastObstacle = this.obstacles[this.obstacles.length - 1];
    if (!lastObstacle || lastObstacle.x < W - this.nextGap) {
      const kind = KINDS[Math.floor(Math.random() * KINDS.length)];
      this.obstacles.push({ ...kind, x: W + 10, passed: false });
      this.nextGap = 240 + Math.random() * 220 + this.speed * 0.25;
    }

    const px = 60;
    const pw = 22;
    for (const o of this.obstacles) {
      if (!o.passed && o.x + o.w < px) {
        o.passed = true;
        this.dodged++;
      }
      const overlapsX = px + pw - 5 > o.x + 3 && px + 5 < o.x + o.w - 3;
      // A few pixels of forgiveness so near-misses feel fair.
      if (overlapsX && GROUND + this.y > GROUND - o.h + 4) {
        this.finish(false);
        return;
      }
    }
    if (this.dodged >= RunnerGame.GOAL) this.finish(true);
  }

  private finish(won: boolean): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const score = Math.floor(this.distance / 10);
    if (score > this.best) {
      this.best = score;
      try {
        localStorage.setItem('kb-runner-best', String(score));
      } catch {
        /* storage unavailable */
      }
    }
    this.draw(won ? 'Shipped! Run complete' : 'Crashed into prod. Tap to retry', won);
    this.onEnd({ score, dodged: this.dodged, jumps: this.jumps, seconds: this.elapsed, won });
  }

  private draw(message?: string, won = false): void {
    const c = this.ctx;
    c.clearRect(0, 0, W, H);
    c.fillStyle = '#14110c';
    c.fillRect(0, 0, W, H);

    c.fillStyle = 'rgba(245,240,232,0.35)';
    for (const s of this.stars) {
      const x = this.reducedMotion ? s.x : (((s.x - this.distance * 0.05 * s.s) % W) + W) % W;
      c.fillRect(x, s.y, s.s, s.s);
    }

    c.strokeStyle = GOLD;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(0, GROUND + 0.5);
    c.lineTo(W, GROUND + 0.5);
    c.stroke();
    c.fillStyle = 'rgba(201,169,110,0.35)';
    for (let i = 0; i < 24; i++) {
      c.fillRect((((i * 37 - this.distance) % W) + W) % W, GROUND + 8 + (i % 3) * 6, 10, 1);
    }

    for (const o of this.obstacles) {
      c.fillStyle = 'rgba(224,138,122,0.18)';
      c.strokeStyle = DANGER;
      c.fillRect(o.x, GROUND - o.h, o.w, o.h);
      c.strokeRect(o.x + 0.5, GROUND - o.h + 0.5, o.w - 1, o.h - 1);
      c.fillStyle = DANGER;
      c.font = '13px "DM Mono", monospace';
      c.textAlign = 'center';
      c.fillText(o.label, o.x + o.w / 2, GROUND - o.h - 6);
    }

    this.drawPlayer(60, GROUND + this.y);

    c.textAlign = 'right';
    c.fillStyle = CREAM;
    c.font = '15px "DM Mono", monospace';
    c.fillText(`SCORE ${Math.floor(this.distance / 10)}   BEST ${this.best}`, W - 14, 22);
    c.textAlign = 'left';
    c.fillStyle = GOLD;
    c.fillText(`DODGED ${this.dodged}/${RunnerGame.GOAL}`, 14, 22);

    if (message) {
      c.textAlign = 'center';
      c.fillStyle = won ? GOLD : CREAM;
      c.font = '20px "DM Mono", monospace';
      c.fillText(message, W / 2, 100);
    }
  }

  private drawPlayer(x: number, baseY: number): void {
    const c = this.ctx;
    const legSwing = this.running && this.y === 0 ? Math.sin(this.elapsed * 22) * 5 : 0;
    c.fillStyle = GOLD;
    c.fillRect(x, baseY - 36, 22, 20); // torso
    c.fillRect(x + 3, baseY - 52, 16, 14); // head
    c.fillStyle = '#14110c';
    c.fillRect(x + 12, baseY - 47, 3, 3); // eye
    c.fillStyle = GOLD;
    c.fillRect(x + 2, baseY - 16, 7, 16 - Math.max(0, legSwing));
    c.fillRect(x + 13, baseY - 16, 7, 16 - Math.max(0, -legSwing));
  }
}
