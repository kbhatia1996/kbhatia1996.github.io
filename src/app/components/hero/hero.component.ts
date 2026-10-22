import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroSection') heroSection!: ElementRef<HTMLElement>;

  scrollProgress = 0;
  contentVisible = false;
  imageFilter = 'grayscale(100%) brightness(0.55)';
  clipPath = 'inset(0)';

  private animFrame: number | null = null;
  private cleanupCursor: (() => void) | null = null;
  private cursorX = 0;
  private cursorY = 0;
  private followerX = 0;
  private followerY = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.initCursor();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.contentVisible = true;
      this.cdr.detectChanges();
    }, 300);
    this.updateScrollProgress();
  }

  ngOnDestroy(): void {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.cleanupCursor?.();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateScrollProgress();
  }

  private updateScrollProgress(): void {
    const hero = this.heroSection?.nativeElement;
    if (!hero) return;

    const heroHeight = hero.offsetHeight;
    const scrolled = window.scrollY;
    // Progress 0 → 1 over first 30% of hero scroll range
    this.scrollProgress = Math.min(Math.max(scrolled / (heroHeight * 0.3), 0), 1);

    // Photo starts desaturated and dimmed, then fades to full colour as the user scrolls
    const grayscale = Math.round((1 - this.scrollProgress) * 100);
    const brightness = 0.55 + this.scrollProgress * 0.45;
    this.imageFilter = `grayscale(${grayscale}%) brightness(${brightness})`;

    this.cdr.detectChanges();
  }

  private initCursor(): void {
    if (!window.matchMedia?.('(hover: hover) and (pointer: fine)').matches) return;

    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    const follower = document.createElement('div');
    follower.className = 'cursor-follower';
    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    const onMove = (e: MouseEvent) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      cursor.classList.toggle('expanded', target.matches('a, button, .interactive'));
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);

    const animateFollower = () => {
      this.followerX += (this.cursorX - this.followerX) * 0.12;
      this.followerY += (this.cursorY - this.followerY) * 0.12;
      follower.style.left = `${this.followerX}px`;
      follower.style.top = `${this.followerY}px`;
      this.animFrame = requestAnimationFrame(animateFollower);
    };
    animateFollower();

    this.cleanupCursor = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      cursor.remove();
      follower.remove();
    };
  }
}
