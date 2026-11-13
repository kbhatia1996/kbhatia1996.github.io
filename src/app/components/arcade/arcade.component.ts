import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  signal,
  viewChild
} from '@angular/core';
import { RunResult, RunnerGame } from './runner.game';

type Size = 'small' | 'large';
type Phase = 'idle' | 'running' | 'done';
type SaveState = 'idle' | 'loading' | 'done';

interface FittsTarget {
  size: Size;
  px: number;
  x: number;
  y: number;
}

interface HickTrial {
  count: number;
  answer: string;
  options: string[];
}

interface Level {
  trait: string;
  game: string;
  pitch: string;
}

const EMAIL = 'kbhatia1996@gmail.com';
const FITTS_SEQUENCE: Size[] = ['small', 'large', 'small', 'large', 'small', 'large'];
const HICK_SEQUENCE = [3, 12, 3, 12, 3, 12];
const WORDS = ['Amber', 'Teal', 'Coral', 'Indigo', 'Olive', 'Ruby', 'Slate', 'Mint', 'Plum', 'Sand', 'Azure', 'Jade'];
const SLOW_SAVE_MS = 2200;
const AUTO_ADVANCE_MS = 3600;
const REPORT = 5;

const avg = (values: number[]): number => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
const shuffle = <T>(items: T[]): T[] => [...items].sort(() => Math.random() - 0.5);

@Component({
  selector: 'app-arcade',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './arcade.component.html',
  styleUrl: './arcade.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArcadeComponent implements OnDestroy {
  readonly email = EMAIL;
  readonly report = REPORT;
  readonly goal = RunnerGame.GOAL;
  readonly fittsRounds = FITTS_SEQUENCE.length;
  readonly hickRounds = HICK_SEQUENCE.length;
  readonly topics = ['Hiring for a role', 'Project / freelance', 'Just saying hi'];
  readonly facts = ['7+ years', 'Banking', 'Healthcare', 'Insurance', 'Java & Spring Boot', 'AWS & Azure', 'Applied AI'];
  readonly levels: Level[] = [
    { trait: 'Precision', game: 'Tap Test', pitch: 'Details sized for real humans, not just for screens.' },
    { trait: 'Clarity', game: 'Choice Test', pitch: 'Cuts through noise to the option that matters.' },
    { trait: 'Speed', game: 'Latency Test', pitch: 'Software that feels instant, even when the work is not.' },
    { trait: 'Resilience', game: 'Prod Run', pitch: 'Keeps shipping past bugs, legacy code and scope creep.' }
  ];
  readonly confetti = Array.from({ length: 32 }, (_, i) => ({
    x: Math.round((Math.random() - 0.5) * 640),
    y: -Math.round(120 + Math.random() * 280),
    r: Math.round(Math.random() * 720 - 360),
    d: Math.round(Math.random() * 250),
    hue: i % 3
  }));

  readonly stage = viewChild<ElementRef<HTMLElement>>('stage');
  readonly runnerCanvas = viewChild<ElementRef<HTMLCanvasElement>>('runner');

  /** 0 = intro, 1-4 = games, 5 = scouting report */
  readonly level = signal(0);
  readonly cleared = signal<ReadonlySet<number>>(new Set());
  readonly autoAdvance = signal(false);
  readonly engaged = signal(false);
  readonly reached = signal(0);
  readonly countdown = signal<number | null>(null);
  readonly xp = signal(0);
  readonly lastHit = signal<number | null>(null);
  readonly sound = signal(this.readSoundPref());
  private audio: AudioContext | null = null;
  private countTimer: ReturnType<typeof setTimeout> | null = null;

  // Level 1: Fitts
  readonly fittsPhase = signal<Phase>('idle');
  readonly fittsRound = signal(0);
  readonly fittsTarget = signal<FittsTarget | null>(null);
  readonly fittsResult = signal<{ small: number; large: number } | null>(null);
  private fittsTimes: Record<Size, number[]> = { small: [], large: [] };
  private fittsShownAt = 0;

  // Level 2: Hick
  readonly hickPhase = signal<Phase>('idle');
  readonly hickRound = signal(0);
  readonly hickTrial = signal<HickTrial | null>(null);
  readonly hickMiss = signal(false);
  readonly hickResult = signal<{ few: number; many: number } | null>(null);
  private hickTimes: Record<number, number[]> = { 3: [], 12: [] };
  private hickShownAt = 0;

  // Level 3: Doherty
  readonly slowState = signal<SaveState>('idle');
  readonly fastState = signal<SaveState>('idle');

  // Level 4: Runner
  readonly runPhase = signal<Phase>('idle');
  readonly runResult = signal<RunResult | null>(null);
  readonly runAttempts = signal(0);
  readonly runBest = signal(0);
  private game: RunnerGame | null = null;

  // Contact
  readonly topic = signal(this.topics[0]);
  readonly copied = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];
  private advanceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly fittsGain = computed(() => {
    const r = this.fittsResult();
    return r && r.small > 0 ? Math.max(0, Math.round((1 - r.large / r.small) * 100)) : 0;
  });
  readonly hickGain = computed(() => {
    const r = this.hickResult();
    return r && r.few > 0 ? Math.max(0, Math.round((r.many / r.few - 1) * 100)) : 0;
  });
  readonly played = computed(() => this.cleared().size);

  readonly mailto = computed(() => {
    const lines = [
      'Hi Karan,',
      '',
      `I just played through Player One on your portfolio and wanted to reach out (${this.topic().toLowerCase()}).`
    ];
    const stats: string[] = [];
    const f = this.fittsResult();
    const h = this.hickResult();
    const r = this.runResult();
    if (f) stats.push(`- Tap Test: ${Math.round(f.small)}ms small vs ${Math.round(f.large)}ms large targets`);
    if (h) stats.push(`- Choice Test: ${(h.few / 1000).toFixed(1)}s with 3 options vs ${(h.many / 1000).toFixed(1)}s with 12`);
    if (r) stats.push(`- Prod Run: score ${r.score}, ${r.dodged} obstacles dodged${r.won ? ' (cleared)' : ''}`);
    if (stats.length) lines.push('', 'My scores:', ...stats);
    lines.push('', 'Here is what I have in mind:', '');
    return `mailto:${EMAIL}?subject=${encodeURIComponent(`${this.topic()} — via Player One`)}&body=${encodeURIComponent(
      lines.join('\n')
    )}`;
  });

  constructor() {
    effect(() => {
      const canvas = this.runnerCanvas();
      this.game?.destroy();
      this.game = null;
      if (canvas) {
        const reduced = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        this.game = new RunnerGame(canvas.nativeElement, (res) => this.onRunEnd(res), reduced);
        this.runBest.set(this.game.best);
      }
    });
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    this.cancelCountdown();
    this.clearAdvance();
    this.game?.destroy();
  }

  // ---- Flow ----
  begin(): void {
    this.goTo(1);
  }

  goTo(target: number): void {
    this.clearAdvance();
    this.cancelCountdown();
    this.engaged.set(false);
    this.level.set(target);
    this.reached.update((r) => Math.max(r, target));
    this.timers.push(
      setTimeout(() => {
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        this.stage()?.nativeElement.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }, 60)
    );
    const autoStart: Record<number, () => void> = {
      1: () => this.startFitts(),
      2: () => this.startHick(),
      4: () => this.startRun()
    };
    if (autoStart[target]) this.launch(autoStart[target]);
  }

  /** Short 3-2-1 so the game begins without an extra click, but never by surprise. */
  private launch(start: () => void): void {
    this.cancelCountdown();
    const tick = (n: number) => {
      if (n === 0) {
        this.countdown.set(null);
        this.countTimer = null;
        start();
        return;
      }
      this.countdown.set(n);
      this.beep(380 + (3 - n) * 120, 0.08);
      this.countTimer = setTimeout(() => tick(n - 1), 650);
    };
    this.countTimer = setTimeout(() => tick(3), 750);
  }

  private cancelCountdown(): void {
    if (this.countTimer) clearTimeout(this.countTimer);
    this.countTimer = null;
    this.countdown.set(null);
  }

  replay(step: number): void {
    this.cancelCountdown();
    this.clearAdvance();
    if (step === 1) this.launch(() => this.startFitts());
    if (step === 2) this.launch(() => this.startHick());
    if (step === 4) this.launch(() => this.startRun());
  }

  toggleSound(): void {
    this.sound.update((v) => !v);
    try {
      localStorage.setItem('kb-sound', this.sound() ? '1' : '0');
    } catch {
      /* storage unavailable */
    }
    this.beep(660, 0.08);
  }

  private readSoundPref(): boolean {
    try {
      return localStorage.getItem('kb-sound') !== '0';
    } catch {
      return true;
    }
  }

  private beep(freq: number, seconds = 0.07): void {
    if (!this.sound()) return;
    try {
      this.audio ??= new AudioContext();
      const osc = this.audio.createOscillator();
      const gain = this.audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, this.audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audio.currentTime + seconds);
      osc.connect(gain).connect(this.audio.destination);
      osc.start();
      osc.stop(this.audio.currentTime + seconds);
    } catch {
      /* audio unavailable */
    }
  }

  private feedback(freq: number, xp: number): void {
    this.beep(freq);
    navigator.vibrate?.(8);
    this.xp.update((v) => v + xp);
  }

  next(): void {
    this.goTo(Math.min(this.level() + 1, REPORT));
  }

  skip(): void {
    this.next();
  }

  canVisit(step: number): boolean {
    return step <= this.reached();
  }

  private complete(step: number): void {
    this.cleared.update((s) => new Set(s).add(step));
    this.feedback(880, 50);
    this.engaged.set(false);
    this.clearAdvance();
    this.autoAdvance.set(true);
    this.advanceTimer = setTimeout(() => this.next(), AUTO_ADVANCE_MS);
  }

  /** Any replay cancels the countdown so people can take their time. */
  private clearAdvance(): void {
    if (this.advanceTimer) clearTimeout(this.advanceTimer);
    this.advanceTimer = null;
    this.autoAdvance.set(false);
  }

  // ---- Level 1: Fitts ----
  startFitts(): void {
    this.clearAdvance();
    this.engaged.set(true);
    this.fittsTimes = { small: [], large: [] };
    this.fittsResult.set(null);
    this.fittsRound.set(0);
    this.fittsPhase.set('running');
    this.showFittsTarget();
  }

  private showFittsTarget(): void {
    const size = FITTS_SEQUENCE[this.fittsRound()];
    const px = size === 'small' ? 20 : 64;
    this.fittsTarget.set({ size, px, x: 8 + Math.random() * 84, y: 14 + Math.random() * 72 });
    this.fittsShownAt = performance.now();
  }

  hitFitts(): void {
    const target = this.fittsTarget();
    if (!target) return;
    const took = performance.now() - this.fittsShownAt;
    this.fittsTimes[target.size].push(took);
    this.lastHit.set(Math.round(took));
    this.feedback(520 + this.fittsRound() * 40, 10);
    const next = this.fittsRound() + 1;
    this.fittsRound.set(next);
    if (next >= FITTS_SEQUENCE.length) {
      this.fittsTarget.set(null);
      this.fittsResult.set({ small: avg(this.fittsTimes.small), large: avg(this.fittsTimes.large) });
      this.fittsPhase.set('done');
      this.complete(1);
    } else {
      this.showFittsTarget();
    }
  }

  // ---- Level 2: Hick ----
  startHick(): void {
    this.clearAdvance();
    this.engaged.set(true);
    this.hickTimes = { 3: [], 12: [] };
    this.hickResult.set(null);
    this.hickRound.set(0);
    this.hickPhase.set('running');
    this.nextHickTrial();
  }

  private nextHickTrial(): void {
    const count = HICK_SEQUENCE[this.hickRound()];
    const options = shuffle(WORDS).slice(0, count);
    this.hickTrial.set({ count, options, answer: options[Math.floor(Math.random() * count)] });
    this.hickMiss.set(false);
    this.hickShownAt = performance.now();
  }

  pickHick(option: string): void {
    const trial = this.hickTrial();
    if (!trial) return;
    if (option !== trial.answer) {
      this.hickMiss.set(true);
      this.beep(180, 0.12);
      return;
    }
    const took = performance.now() - this.hickShownAt;
    this.hickTimes[trial.count].push(took);
    this.lastHit.set(Math.round(took));
    this.feedback(520 + this.hickRound() * 40, 10);
    const next = this.hickRound() + 1;
    this.hickRound.set(next);
    if (next >= HICK_SEQUENCE.length) {
      this.hickTrial.set(null);
      this.hickResult.set({ few: avg(this.hickTimes[3]), many: avg(this.hickTimes[12]) });
      this.hickPhase.set('done');
      this.complete(2);
    } else {
      this.nextHickTrial();
    }
  }

  // ---- Level 3: Doherty ----
  saveSlow(): void {
    if (this.slowState() === 'loading') return;
    this.engaged.set(true);
    this.slowState.set('loading');
    this.beep(300, 0.05);
    this.timers.push(
      setTimeout(() => {
        this.slowState.set('done');
        this.beep(560, 0.08);
        this.checkDoherty();
      }, SLOW_SAVE_MS)
    );
  }

  saveFast(): void {
    this.engaged.set(true);
    // Optimistic update: confirm instantly, reconcile in the background.
    this.fastState.set('done');
    this.feedback(740, 10);
    this.checkDoherty();
  }

  private checkDoherty(): void {
    if (this.slowState() === 'done' && this.fastState() === 'done' && !this.cleared().has(3)) this.complete(3);
  }

  resetDoherty(): void {
    this.clearAdvance();
    this.slowState.set('idle');
    this.fastState.set('idle');
  }

  // ---- Level 4: Runner ----
  startRun(): void {
    if (!this.game || this.game.isRunning) return;
    this.clearAdvance();
    this.engaged.set(true);
    this.runResult.set(null);
    this.runPhase.set('running');
    this.runAttempts.update((n) => n + 1);
    this.game.start();
    this.runnerCanvas()?.nativeElement.focus({ preventScroll: true });
  }

  onRunnerKey(event: KeyboardEvent): void {
    if (event.code !== 'Space' && event.code !== 'ArrowUp') return;
    event.preventDefault();
    this.runnerInput();
  }

  runnerInput(): void {
    if (this.game?.isRunning) {
      this.game.jump();
      this.beep(440, 0.05);
    }
    else if (this.countdown() === null) this.startRun();
  }

  private onRunEnd(result: RunResult): void {
    this.runResult.set(result);
    this.runPhase.set('done');
    this.xp.update((v) => v + result.dodged * 5);
    this.beep(result.won ? 880 : 160, 0.15);
    this.runBest.set(this.game?.best ?? 0);
    this.engaged.set(false);
    // A crash is part of the game: only a cleared run completes the level.
    if (result.won) this.complete(4);
  }

  // ---- Contact ----
  async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(EMAIL);
      this.copied.set(true);
      this.timers.push(setTimeout(() => this.copied.set(false), 2200));
    } catch {
      this.copied.set(false);
    }
  }
}
