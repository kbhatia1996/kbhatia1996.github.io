import { Component, OnDestroy, OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-work',
  standalone: true,
  templateUrl: './work.component.html',
  styleUrl: './work.component.scss'
})
export class WorkComponent implements OnInit, OnDestroy {
  readonly hirelensShots = [
    { src: 'assets/images/hirelens-ranking.jpg', tab: 'Ranked candidates', alt: 'HireLens ranked candidate table with scores, verdicts and matched skills' },
    { src: 'assets/images/hirelens-score.jpg', tab: 'Why this score', alt: 'HireLens candidate panel explaining the score: skills fit, experience, education and role relevance' },
    { src: 'assets/images/hirelens-pool.jpg', tab: 'Talent pool search', alt: 'HireLens talent pool with a plain-English search and ranked matches with relevance' }
  ];
  readonly hirelensArticle =
    'https://medium.com/@kbhatia1996/build-your-own-ai-powered-resume-screening-assistant-with-n8n-langchain-and-angular-0944132a35eb';
  readonly shot = signal(0);
  private shotPaused = false;
  private shotTimer: ReturnType<typeof setInterval> | null = null;

  readonly pigeons = {
    live: 'https://proper-productive-pigeons.onrender.com/',
    repo: 'https://github.com/kbhatia1996/Proper-Productivity-App'
  };

  ngOnInit(): void {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    this.shotTimer = setInterval(() => {
      if (!this.shotPaused) this.shot.update((i) => (i + 1) % this.hirelensShots.length);
    }, 5000);
  }

  ngOnDestroy(): void {
    if (this.shotTimer) clearInterval(this.shotTimer);
  }

  pickShot(i: number): void {
    this.shot.set(i);
    this.shotPaused = true;
  }

  pauseShots(paused: boolean): void {
    this.shotPaused = paused;
  }
}
