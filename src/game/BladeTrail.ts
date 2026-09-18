import { BladeStyle, SwipePoint } from '../types';

export class BladeTrail {
  private points: SwipePoint[] = [];
  private maxAge: number = 0.16; // 160ms lifetime
  public style: BladeStyle = 'cyan';

  public addPoint(x: number, y: number, time: number) {
    // Avoid adding identical points
    if (this.points.length > 0) {
      const last = this.points[this.points.length - 1];
      const dx = x - last.x;
      const dy = y - last.y;
      if (dx * dx + dy * dy < 4) return;
    }
    this.points.push({ x, y, time });
  }

  public clear() {
    this.points = [];
  }

  public update(currentTime: number) {
    this.points = this.points.filter((p) => currentTime - p.time < this.maxAge);
  }

  public getPoints(): SwipePoint[] {
    return this.points;
  }

  public render(ctx: CanvasRenderingContext2D, currentTime: number) {
    if (this.points.length < 2) return;

    ctx.save();

    const colors = this.getStyleColors();

    // 1. Draw soft outer aura glow
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < this.points.length - 1; i++) {
      const p1 = this.points[i];
      const p2 = this.points[i + 1];

      const age1 = (currentTime - p1.time) / this.maxAge;
      const age2 = (currentTime - p2.time) / this.maxAge;
      const alpha = Math.max(0, 1 - (age1 + age2) / 2);
      const width = Math.max(1, (1 - (age1 + age2) / 2) * 14);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      // Glow layer
      ctx.strokeStyle = colors.glow;
      ctx.lineWidth = width * 1.8;
      ctx.globalAlpha = alpha * 0.45;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Colored body
      ctx.strokeStyle = this.style === 'rainbow' ? `hsl(${(i * 35 + currentTime * 500) % 360}, 100%, 65%)` : colors.main;
      ctx.lineWidth = width;
      ctx.globalAlpha = alpha * 0.85;
      ctx.shadowBlur = 4;
      ctx.stroke();

      // Sharp white core
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = Math.max(1, width * 0.35);
      ctx.globalAlpha = alpha * 0.95;
      ctx.shadowBlur = 0;
      ctx.stroke();
    }

    ctx.restore();
  }

  private getStyleColors(): { main: string; glow: string } {
    switch (this.style) {
      case 'flame':
        return { main: '#f97316', glow: '#ef4444' };
      case 'emerald':
        return { main: '#10b981', glow: '#059669' };
      case 'violet':
        return { main: '#a855f7', glow: '#7c3aed' };
      case 'rainbow':
        return { main: '#38bdf8', glow: '#f43f5e' };
      case 'cyan':
      default:
        return { main: '#06b6d4', glow: '#0ea5e9' };
    }
  }
}
