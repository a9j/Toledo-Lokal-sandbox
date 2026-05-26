// Lightweight, dependency-free celebration: a confetti burst plus a soft
// haptic. Used when a brand joins the Founding 5 / 50 live.

const COLORS = ['#fbbf24', '#f59e0b', '#34d399', '#60a5fa', '#f472b6', '#ffffff'];

export function softHaptic() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([10, 30, 10]);
    } catch {
      // some browsers throw if vibration is blocked; ignore
    }
  }
}

export function celebrate() {
  softHaptic();

  if (typeof document === 'undefined') return;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(container);

  const pieces = 90;
  const vh = window.innerHeight;

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div');
    const size = 6 + Math.random() * 6;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    piece.style.cssText =
      `position:absolute;top:-16px;left:${Math.random() * 100}%;` +
      `width:${size}px;height:${size * 0.6}px;background:${color};border-radius:2px;`;
    container.appendChild(piece);

    const xDrift = (Math.random() - 0.5) * 260;
    const rotate = Math.random() * 720 - 360;
    const duration = 1800 + Math.random() * 1500;
    const delay = Math.random() * 250;

    piece.animate(
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${xDrift}px, ${vh + 40}px) rotate(${rotate}deg)`,
          opacity: 1,
          offset: 0.9,
        },
        {
          transform: `translate(${xDrift}px, ${vh + 90}px) rotate(${rotate}deg)`,
          opacity: 0,
        },
      ],
      { duration, delay, easing: 'cubic-bezier(0.2,0.6,0.4,1)', fill: 'forwards' },
    );
  }

  window.setTimeout(() => container.remove(), 3800);
}
