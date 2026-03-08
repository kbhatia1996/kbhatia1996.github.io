# Portfolio — Angular Clone of jonathanjakubas.com

Scroll-driven portfolio with silhouette → full image reveal, custom cursor, and editorial dark aesthetic.

## Key Features
- Silhouette SVG → photo reveal driven by scroll progress
- Grayscale → full color image transition
- Clip-path wipe animation (top-down reveal)
- Custom animated cursor (dot + ring follower)
- Sticky hero with progress-based animations
- Playfair Display + Syne + DM Mono typography

## Setup

```bash
npm install -g @angular/cli
ng new portfolio --routing=false --style=scss
cd portfolio
# Copy these src/ files into your src/ folder
ng serve
```

## File Structure

```
src/
  styles.scss                    ← Global: fonts, cursor, CSS variables
  app/
    app.component.*              ← Root component
    components/
      navbar/                    ← Sticky nav, scroll-aware
      hero/                      ← THE SCROLL REVEAL (main effect)
      about/                     ← Skills + bio
      work/                      ← Project list with hover effects
      contact/                   ← Email + social links
```

## How The Silhouette Reveal Works

In `hero.component.ts`, `updateScrollProgress()` computes a 0→1 value based on scroll position.

This drives:
1. **Silhouette opacity**: `1 - progress * 2` (fades OUT)
2. **Image opacity**: `progress * 2 - 0.3` (fades IN)  
3. **CSS filter**: `grayscale(X%) brightness(Y)` (desaturated → full color)
4. **Clip-path**: `inset(0 0 X% 0)` (wipe from top)

## Swap In Your Photo

## Customize

All colors and fonts in `src/styles.scss` under `:root {}`.
All content in respective component `.html` and `.ts` files.
