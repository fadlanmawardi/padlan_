const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d6", "#a855f7"];

interface ConfettiOptions {
  count?: number;
  spread?: number;
  sourceX?: number;
  sourceY?: number;
}

export function burstConfetti({
  count = 80,
  spread = 90,
  sourceX,
  sourceY,
}: ConfettiOptions = {}): void {
  if (typeof document === "undefined") return;
  const x =
    sourceX ?? Math.min(Math.max(window.innerWidth / 2, 0), window.innerWidth);
  const y = sourceY ?? Math.min(Math.max(window.innerHeight / 3, 0), window.innerHeight);

  const layer = document.createElement("div");
  layer.setAttribute(
    "style",
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;"
  );
  document.body.appendChild(layer);

  for (let index = 0; index < count; index++) {
    const piece = document.createElement("span");
    const angle = (Math.random() - 0.5) * 2 * spread;
    const velocity = 8 + Math.random() * 12;
    const size = 6 + Math.random() * 6;
    const color = COLORS[index % COLORS.length];
    piece.setAttribute(
      "style",
      `position:absolute;left:${x}px;top:${y}px;width:${size}px;height:${size * 0.6}px;background:${color};border-radius:2px;will-change:transform,opacity;`
    );
    layer.appendChild(piece);

    const angleRad = (angle * Math.PI) / 180;
    const dx = Math.sin(angleRad) * velocity * 14;
    const dy = -(Math.abs(Math.cos(angleRad)) * velocity * 14 + 30);
    const rotation = 360 + Math.random() * 540;

    piece.animate(
      [
        { transform: `translate(0, 0) rotate(0)`, opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${rotation / 2}deg)`,
          opacity: 1,
          offset: 0.35,
        },
        {
          transform: `translate(${dx * 1.3}px, ${dy + window.innerHeight * 0.45}px) rotate(${rotation}deg)`,
          opacity: 0,
        },
      ],
      { duration: 1400 + Math.random() * 900, easing: "cubic-bezier(0.2, 0.6, 0.35, 1)" }
    ).finished.then(() => piece.remove());
  }

  window.setTimeout(() => layer.remove(), 3000);
}
