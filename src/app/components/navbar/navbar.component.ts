import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {
  isScrolled = false;

  ngOnInit(): void {}

  @HostListener('window:scroll')
  onScroll(): void {
    this.isScrolled = window.scrollY > 50;
  }

  onLinkHover(isHovering: boolean): void {
    const cursor = document.querySelector('.cursor');
    if (isHovering) {
      cursor?.classList.add('expanded');
    } else {
      cursor?.classList.remove('expanded');
    }
  }
}
