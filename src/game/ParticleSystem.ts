import { FloatingTextEntity, ParticleEntity, SplatDecal } from '../types';

export class ParticleSystem {
  private particles: ParticleEntity[] = [];
  private splats: SplatDecal[] = [];
  private floatingTexts: FloatingTextEntity[] = [];
  private nextTextId: number = 1;

  public clear() {
    this.particles = [];
    this.splats = [];
    this.floatingTexts = [];
  }

  /**
   * Spawns juicy splash droplets and a permanent background splatter decal
   */
  public spawnJuiceSplash(
    x: number,
    y: number,
    juiceColor: string,
    secondaryColor: string,
    sliceAngle: number,
    count: number = 22
  ) {
    // 1. Background Splat Decal
    const blots: { dx: number; dy: number; r: number }[] = [];
    const blotCount = 5 + Math.floor(Math.random() * 4);
    for (let b = 0; b < blotCount; b++) {
      const dist = 10 + Math.random() * 32;
      const ang = Math.random() * Math.PI * 2;
      blots.push({
        dx: Math.cos(ang) * dist,
        dy: Math.sin(ang) * dist,
        r: 3 + Math.random() * 7,
      });
    }

    this.splats.push({
      x,
      y,
      radius: 20 + Math.random() * 15,
      color: juiceColor,
      alpha: 0.45,
      rotation: Math.random() * Math.PI * 2,
      blots,
    });

    // Limit maximum background splats to keep performance ultra-high
    if (this.splats.length > 25) {
      this.splats.shift();
    }

    // 2. Flying Juice Droplets
    for (let i = 0; i < count; i++) {
      // Direct droplets roughly perpendicular and along slice angle
      const spread = (Math.random() - 0.5) * Math.PI * 1.2;
      const angle = sliceAngle + spread + (Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2);
      const speed = 120 + Math.random() * 380;
      const radius = 2.5 + Math.random() * 5.5;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60, // slight upward kick
        radius,
        color: Math.random() > 0.35 ? juiceColor : secondaryColor,
        alpha: 1.0,
        decay: 1.2 + Math.random() * 1.4, // fades in ~0.5 - 0.8s
        gravity: 650,
        type: 'juice',
      });
    }
  }

  /**
   * Spawns explosive fiery bomb blast particles and shockwaves
   */
  public spawnBombExplosion(x: number, y: number) {
    // Expanding fiery blast ring
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: 10,
      maxRadius: 180,
      color: '#f97316',
      alpha: 1.0,
      decay: 2.2,
      gravity: 0,
      type: 'ring',
    });

    // Dense fiery spark burst
    const sparkCount = 45;
    for (let i = 0; i < sparkCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 180 + Math.random() * 520;
      const colors = ['#ffffff', '#fde047', '#f97316', '#ef4444', '#71717a'];
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 6,
        color,
        alpha: 1.0,
        decay: 1.0 + Math.random() * 1.8,
        gravity: 400,
        type: 'spark',
      });
    }

    // Smoke clouds
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        radius: 12 + Math.random() * 16,
        color: '#334155',
        alpha: 0.6,
        decay: 0.8 + Math.random() * 0.6,
        gravity: -60, // rises slightly
        type: 'smoke',
      });
    }
  }

  /**
   * Spawns floating score or combo popups
   */
  public addFloatingText(
    text: string,
    x: number,
    y: number,
    color: string = '#facc15',
    isCombo: boolean = false
  ) {
    this.floatingTexts.push({
      id: this.nextTextId++,
      text,
      x,
      y,
      vy: -70,
      color,
      scale: isCombo ? 1.4 : 1.0,
      alpha: 1.0,
      lifetime: 0,
      maxLifetime: isCombo ? 1.2 : 0.85,
      isCombo,
    });
  }

  public update(dt: number) {
    // 1. Update flying particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.alpha -= p.decay * dt;

      if (p.type === 'ring' && p.maxRadius) {
        p.radius += (p.maxRadius - p.radius) * 12 * dt;
      }

      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 2. Slowly fade background juice splat decals
    for (let i = this.splats.length - 1; i >= 0; i--) {
      const s = this.splats[i];
      s.alpha -= 0.04 * dt; // persists for ~10 seconds
      if (s.alpha <= 0) {
        this.splats.splice(i, 1);
      }
    }

    // 3. Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.lifetime += dt;
      ft.y += ft.vy * dt;
      const progress = ft.lifetime / ft.maxLifetime;

      if (progress < 0.2) {
        // Pop in scale
        ft.scale = (ft.isCombo ? 1.4 : 1.0) * (0.8 + (progress / 0.2) * 0.4);
      } else {
        // Float away
        ft.alpha = Math.max(0, 1 - (progress - 0.2) / 0.8);
      }

      if (ft.lifetime >= ft.maxLifetime) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  /**
   * Renders background splats (called before drawing fruits)
   */
  public renderSplats(ctx: CanvasRenderingContext2D) {
    if (this.splats.length === 0) return;

    ctx.save();
    for (const s of this.splats) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.color;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rotation);

      // Central splat puddle
      ctx.beginPath();
      ctx.ellipse(0, 0, s.radius, s.radius * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();

      // Little satellite drip spots
      for (const b of s.blots) {
        ctx.beginPath();
        ctx.arc(b.dx, b.dy, b.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  /**
   * Renders foreground particles (called after fruits)
   */
  public renderParticles(ctx: CanvasRenderingContext2D) {
    if (this.particles.length === 0) return;

    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);

      if (p.type === 'ring') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 6 * (p.alpha);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.radius * p.alpha), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  /**
   * Renders floating texts with glowing shadow
   */
  public renderFloatingTexts(ctx: CanvasRenderingContext2D) {
    if (this.floatingTexts.length === 0) return;

    ctx.save();
    ctx.font = 'bold 24px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const ft of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.translate(ft.x, ft.y);
      ctx.scale(ft.scale, ft.scale);

      // Dark outline for contrast
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.lineWidth = 5;
      ctx.strokeText(ft.text, 0, 0);

      // Main vibrant fill
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, 0, 0);

      ctx.restore();
    }
    ctx.restore();
  }
}
