import { AfterViewInit, Component, ElementRef, OnDestroy, signal, viewChild } from '@angular/core';

const REVEAL_END = 0.75; // portion of the sticky scroll range used by the wipe

@Component({
  selector: 'app-hero',
  standalone: true,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements AfterViewInit, OnDestroy {
  readonly heroSection = viewChild.required<ElementRef<HTMLElement>>('heroSection');
  readonly progressBar = viewChild.required<ElementRef<HTMLElement>>('progressBar');
  readonly tilt = viewChild.required<ElementRef<HTMLElement>>('tilt');

  readonly contentVisible = signal(false);
  readonly hintHidden = signal(false);

  private frame = 0;
  private scrollQueued = false;
  private cleanups: Array<() => void> = [];
  private reducedMotion = false;

  private cursor: HTMLElement | null = null;
  private follower: HTMLElement | null = null;
  private mouse = { x: -100, y: -100 };
  private follow = { x: -100, y: -100 };
  private tiltTarget = { x: 0, y: 0 };
  private tiltNow = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    this.reducedMotion = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => this.contentVisible.set(true), 300);

    const onScroll = () => {
      if (this.scrollQueued) return;
      this.scrollQueued = true;
      requestAnimationFrame(() => {
        this.scrollQueued = false;
        this.updateScroll();
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    this.cleanups.push(() => window.removeEventListener('scroll', onScroll), () => window.removeEventListener('resize', onScroll));
    this.updateScroll();

    if (window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) this.initPointer();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
    this.cleanups.forEach((fn) => fn());
    this.cursor?.remove();
    this.follower?.remove();
  }

  /** Writes CSS variables only; layout and styles do the rest on the compositor. */
  private updateScroll(): void {
    const hero = this.heroSection().nativeElement;
    const range = Math.max(hero.offsetHeight - window.innerHeight, 1);
    const t = Math.min(Math.max(window.scrollY / range, 0), 1);
    const reveal = Math.min(t / REVEAL_END, 1);
    hero.style.setProperty('--t', t.toFixed(4));
    hero.style.setProperty('--p', reveal.toFixed(4));

    const doc = document.documentElement;
    const page = doc.scrollHeight - window.innerHeight;
    this.progressBar().nativeElement.style.transform = `scaleX(${page > 0 ? Math.min(window.scrollY / page, 1).toFixed(4) : 0})`;

    const hidden = window.scrollY > 40;
    if (hidden !== this.hintHidden()) this.hintHidden.set(hidden);
  }

  private initPointer(): void {
    this.cursor = document.createElement('div');
    this.cursor.className = 'cursor';
    this.follower = document.createElement('div');
    this.follower.className = 'cursor-follower';
    document.body.append(this.cursor, this.follower);

    const onMove = (e: PointerEvent) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
      // The dot follows the pointer exactly; only the ring is smoothed.
      this.cursor!.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0) translate(-50%, -50%)`;
      if (!this.reducedMotion) {
        this.tiltTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
        this.tiltTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }
      this.schedule();
    };
    const onOver = (e: Event) => {
      const interactive = (e.target as HTMLElement).closest?.('a, button, .interactive, [role="radio"]');
      this.cursor!.classList.toggle('expanded', !!interactive);
      this.follower!.classList.toggle('hidden', !!interactive);
    };
    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    this.cleanups.push(
      () => document.removeEventListener('pointermove', onMove),
      () => document.removeEventListener('mouseover', onOver)
    );
  }

  /** Runs only while something is still easing, then goes idle. */
  private schedule(): void {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      const k = this.reducedMotion ? 1 : 0.22;
      this.follow.x += (this.mouse.x - this.follow.x) * k;
      this.follow.y += (this.mouse.y - this.follow.y) * k;
      this.follower!.style.transform = `translate3d(${this.follow.x}px, ${this.follow.y}px, 0) translate(-50%, -50%)`;

      this.tiltNow.x += (this.tiltTarget.x - this.tiltNow.x) * 0.08;
      this.tiltNow.y += (this.tiltTarget.y - this.tiltNow.y) * 0.08;
      const el = this.tilt().nativeElement;
      el.style.setProperty('--rx', (-this.tiltNow.y * 4).toFixed(2));
      el.style.setProperty('--ry', (this.tiltNow.x * 6).toFixed(2));

      const settling =
        Math.abs(this.mouse.x - this.follow.x) > 0.3 ||
        Math.abs(this.mouse.y - this.follow.y) > 0.3 ||
        Math.abs(this.tiltTarget.x - this.tiltNow.x) > 0.002 ||
        Math.abs(this.tiltTarget.y - this.tiltNow.y) > 0.002;
      if (settling) this.schedule();
    });
  }
}
