import { Component, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly isScrolled = signal(false);

  private readonly onScroll = () => {
    const scrolled = window.scrollY > 50;
    if (scrolled !== this.isScrolled()) this.isScrolled.set(scrolled);
  };

  ngOnInit(): void {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.onScroll();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }
}
