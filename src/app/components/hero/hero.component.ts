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
  imageFilter = 'grayscale(100%) brightness(0.3)';
  clipPath = 'inset(100% 0 0 0)';

  private animFrame: number | null = null;
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
    // Progress 0 → 1 over first 50% of hero scroll range
    this.scrollProgress = Math.min(Math.max(scrolled / (heroHeight * 0.5), 0), 1);

    // Colour layer: starts fully greyscale+dark, transitions to full colour
    const grayscale = Math.round((1 - this.scrollProgress) * 100);
    const brightness = 0.25 + this.scrollProgress * 0.75;
    this.imageFilter = `grayscale(${grayscale}%) brightness(${brightness})`;

    // Clip-path wipes the colour layer DOWN from the top as scroll increases
    // At progress=0: colour layer fully clipped (hidden). At 1: fully visible.
    const hiddenPct = Math.round((1 - this.scrollProgress) * 100);
    this.clipPath = `inset(0 0 ${hiddenPct}% 0)`;

    this.cdr.detectChanges();
  }

  private initCursor(): void {
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    const follower = document.createElement('div');
    follower.className = 'cursor-follower';
    document.body.appendChild(cursor);
    document.body.appendChild(follower);

    document.addEventListener('mousemove', (e) => {
      this.cursorX = e.clientX;
      this.cursorY = e.clientY;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });

    const animateFollower = () => {
      this.followerX += (this.cursorX - this.followerX) * 0.12;
      this.followerY += (this.cursorY - this.followerY) * 0.12;
      follower.style.left = `${this.followerX}px`;
      follower.style.top = `${this.followerY}px`;
      this.animFrame = requestAnimationFrame(animateFollower);
    };
    animateFollower();

    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('a, button, .interactive')) {
        cursor.classList.add('expanded');
      } else {
        cursor.classList.remove('expanded');
      }
    });
  }
}