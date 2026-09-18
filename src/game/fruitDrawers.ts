import { FruitType } from '../types';
import { FRUIT_CONFIGS } from './fruitConfigs';

/**
 * Draws a whole fruit with original arcade vector aesthetics.
 */
export function drawWholeFruit(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  radius: number,
  angle: number
) {
  ctx.save();
  ctx.rotate(angle);

  switch (type) {
    case 'apple':
      drawApple(ctx, radius);
      break;
    case 'watermelon':
      drawWatermelon(ctx, radius);
      break;
    case 'orange':
      drawOrange(ctx, radius);
      break;
    case 'banana':
      drawBanana(ctx, radius);
      break;
    case 'pineapple':
      drawPineapple(ctx, radius);
      break;
    case 'strawberry':
      drawStrawberry(ctx, radius);
      break;
    case 'mango':
      drawMango(ctx, radius);
      break;
    case 'kiwi':
      drawKiwi(ctx, radius);
      break;
  }

  ctx.restore();
}

/**
 * Draws half of a fruit (sliced) along the slice line.
 * isRightSide determines which half is rendered.
 */
export function drawSlicedHalf(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  radius: number,
  isRightSide: boolean,
  opacity: number
) {
  ctx.save();
  ctx.globalAlpha = opacity;

  // Clip to half-plane
  ctx.beginPath();
  if (isRightSide) {
    ctx.rect(0, -radius * 1.5, radius * 1.6, radius * 3.0);
  } else {
    ctx.rect(-radius * 1.6, -radius * 1.5, radius * 1.6, radius * 3.0);
  }
  ctx.clip();

  // Draw the outer fruit shape
  switch (type) {
    case 'apple':
      drawApple(ctx, radius);
      break;
    case 'watermelon':
      drawWatermelon(ctx, radius);
      break;
    case 'orange':
      drawOrange(ctx, radius);
      break;
    case 'banana':
      drawBanana(ctx, radius);
      break;
    case 'pineapple':
      drawPineapple(ctx, radius);
      break;
    case 'strawberry':
      drawStrawberry(ctx, radius);
      break;
    case 'mango':
      drawMango(ctx, radius);
      break;
    case 'kiwi':
      drawKiwi(ctx, radius);
      break;
  }

  // Draw cut interior surface overlay
  drawCutSurface(ctx, type, radius, isRightSide);

  ctx.restore();
}

/**
 * Draws the succulent sliced inner face texture along the center cut line
 */
function drawCutSurface(
  ctx: CanvasRenderingContext2D,
  type: FruitType,
  radius: number,
  isRightSide: boolean
) {
  const cfg = FRUIT_CONFIGS[type];
  const sideMul = isRightSide ? 1 : -1;

  ctx.save();

  // Thin slice line highlight
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.95);
  ctx.lineTo(0, radius * 0.95);
  ctx.stroke();

  // Draw subtle inner flesh tint along cut
  ctx.fillStyle = cfg.fleshColor;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.ellipse(sideMul * (radius * 0.18), 0, radius * 0.35, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Specialized interior details
  if (type === 'watermelon') {
    // Watermelon seeds
    ctx.fillStyle = '#1e1b18';
    ctx.globalAlpha = 0.9;
    [-0.5, 0, 0.5].forEach((offsetY) => {
      ctx.beginPath();
      ctx.ellipse(sideMul * (radius * 0.25), offsetY * radius * 0.9, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (type === 'kiwi') {
    // Kiwi black seed ring
    ctx.fillStyle = '#18181b';
    ctx.globalAlpha = 0.95;
    [-0.4, -0.2, 0, 0.2, 0.4].forEach((offsetY) => {
      ctx.beginPath();
      ctx.arc(sideMul * (radius * 0.2), offsetY * radius * 0.8, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    // Pale cream core
    ctx.fillStyle = '#fef08a';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(sideMul * (radius * 0.05), 0, radius * 0.12, radius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'apple') {
    // Apple core cavity
    ctx.fillStyle = '#713f12';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(sideMul * (radius * 0.1), 0, 3, 6, 0.2 * sideMul, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'orange') {
    // Orange segments radiating lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(sideMul * 2, i * (radius * 0.25));
      ctx.lineTo(sideMul * (radius * 0.6), i * (radius * 0.35));
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * INDIVIDUAL FRUIT VECTOR RENDERERS
 */

function drawApple(ctx: CanvasRenderingContext2D, r: number) {
  // Apple body gradient
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#f87171');
  grad.addColorStop(0.6, '#dc2626');
  grad.addColorStop(1, '#991b1b');

  ctx.fillStyle = grad;
  ctx.beginPath();
  // Apple lobed silhouette
  ctx.moveTo(0, -r * 0.7);
  ctx.bezierCurveTo(r * 0.5, -r * 1.1, r * 1.2, -r * 0.4, r * 0.9, r * 0.5);
  ctx.bezierCurveTo(r * 0.7, r * 1.1, r * 0.2, r * 0.95, 0, r * 0.8);
  ctx.bezierCurveTo(-r * 0.2, r * 0.95, -r * 0.7, r * 1.1, -r * 0.9, r * 0.5);
  ctx.bezierCurveTo(-r * 1.2, -r * 0.4, -r * 0.5, -r * 1.1, 0, -r * 0.7);
  ctx.closePath();
  ctx.fill();

  // Glossy highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.35, r * 0.2, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // Stem
  ctx.strokeStyle = '#54311c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.65);
  ctx.quadraticCurveTo(r * 0.2, -r * 1.15, r * 0.15, -r * 1.25);
  ctx.stroke();

  // Leaf
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(r * 0.35, -r * 1.05, r * 0.28, r * 0.14, 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawWatermelon(ctx: CanvasRenderingContext2D, r: number) {
  // Round outer rind
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#22c55e');
  grad.addColorStop(0.7, '#15803d');
  grad.addColorStop(1, '#14532d');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Wavy dark emerald stripes
  ctx.strokeStyle = '#052e16';
  ctx.lineWidth = r * 0.16;
  ctx.lineCap = 'round';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    const startX = (i * r) / 2.5;
    ctx.moveTo(startX, -r * 0.85);
    ctx.bezierCurveTo(
      startX + (i % 2 === 0 ? 15 : -15),
      -r * 0.2,
      startX - (i % 2 === 0 ? 15 : -15),
      r * 0.2,
      startX,
      r * 0.85
    );
    ctx.stroke();
  }

  // Specular sheen
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.35, -r * 0.35, r * 0.3, r * 0.15, -0.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawOrange(ctx: CanvasRenderingContext2D, r: number) {
  const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#fed7aa');
  grad.addColorStop(0.3, '#fb923c');
  grad.addColorStop(0.85, '#ea580c');
  grad.addColorStop(1, '#c2410c');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // Peel texture dimples
  ctx.fillStyle = 'rgba(194, 65, 12, 0.3)';
  const dimpleAngles = [0.2, 0.8, 1.5, 2.3, 3.1, 4.0, 4.8, 5.5];
  dimpleAngles.forEach((ang) => {
    const dist = r * 0.55;
    ctx.beginPath();
    ctx.arc(Math.cos(ang) * dist, Math.sin(ang) * dist, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top stem button
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.arc(0, -r * 0.85, 4, 0, Math.PI * 2);
  ctx.fill();

  // Gloss
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.35, r * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawBanana(ctx: CanvasRenderingContext2D, r: number) {
  ctx.save();
  // Curved banana crescent
  ctx.beginPath();
  ctx.moveTo(-r * 0.9, r * 0.6);
  ctx.bezierCurveTo(-r * 0.3, -r * 0.7, r * 0.4, -r * 0.8, r * 1.0, -r * 0.3);
  ctx.bezierCurveTo(r * 0.3, -r * 0.1, -r * 0.2, r * 0.2, -r * 0.9, r * 0.6);
  ctx.closePath();

  const grad = ctx.createLinearGradient(-r * 0.5, -r * 0.5, r * 0.5, r * 0.5);
  grad.addColorStop(0, '#fef08a');
  grad.addColorStop(0.5, '#eab308');
  grad.addColorStop(1, '#ca8a04');
  ctx.fillStyle = grad;
  ctx.fill();

  // Edge ridges
  ctx.strokeStyle = '#a16207';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Green stem end
  ctx.fillStyle = '#65a30d';
  ctx.beginPath();
  ctx.arc(r * 1.0, -r * 0.3, 5, 0, Math.PI * 2);
  ctx.fill();

  // Brown tip
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(-r * 0.9, r * 0.6, 4.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPineapple(ctx: CanvasRenderingContext2D, r: number) {
  // Pineapple body (oval)
  const grad = ctx.createRadialGradient(-r * 0.2, 0, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#fde047');
  grad.addColorStop(0.5, '#eab308');
  grad.addColorStop(0.85, '#ca8a04');
  grad.addColorStop(1, '#78350f');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r * 0.7, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Diamond skin grid pattern
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.55)';
  ctx.lineWidth = 2.5;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, r * 0.15, r * 0.7, r * 0.85, 0, 0, Math.PI * 2);
  ctx.clip();

  for (let i = -4; i <= 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-r, i * 20 - r * 0.5);
    ctx.lineTo(r, i * 20 + r * 0.5);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(r, i * 20 - r * 0.5);
    ctx.lineTo(-r, i * 20 + r * 0.5);
    ctx.stroke();
  }
  ctx.restore();

  // Green jagged crown leaves
  const leafColors = ['#166534', '#15803d', '#22c55e'];
  [-0.35, 0, 0.35].forEach((offset, idx) => {
    ctx.fillStyle = leafColors[idx % leafColors.length];
    ctx.beginPath();
    ctx.moveTo(offset * r * 0.5, -r * 0.55);
    ctx.quadraticCurveTo(offset * r * 1.1, -r * 1.3, offset * r * 0.3, -r * 1.2);
    ctx.quadraticCurveTo(0, -r * 0.7, offset * r * 0.5, -r * 0.55);
    ctx.fill();
  });
}

function drawStrawberry(ctx: CanvasRenderingContext2D, r: number) {
  // Heart/cone berry body
  const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#f87171');
  grad.addColorStop(0.4, '#ef4444');
  grad.addColorStop(0.85, '#dc2626');
  grad.addColorStop(1, '#991b1b');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.bezierCurveTo(r * 0.8, -r * 0.7, r * 0.95, 0, 0, r * 0.95);
  ctx.bezierCurveTo(-r * 0.95, 0, -r * 0.8, -r * 0.7, 0, -r * 0.6);
  ctx.closePath();
  ctx.fill();

  // Golden yellow strawberry seeds
  ctx.fillStyle = '#fef08a';
  const seedCoords = [
    [-0.3, -0.2], [0.3, -0.2], [0, -0.1],
    [-0.4, 0.15], [0.4, 0.15], [-0.15, 0.3], [0.15, 0.3],
    [0, 0.6]
  ];
  seedCoords.forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.ellipse(sx * r, sy * r, 2, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Green crown leaves
  ctx.fillStyle = '#16a34a';
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(i * (r * 0.22), -r * 0.65, r * 0.18, r * 0.08, i * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMango(ctx: CanvasRenderingContext2D, r: number) {
  // Smooth asymmetrical tropical fruit with vermilion-to-yellow blush
  const grad = ctx.createLinearGradient(-r * 0.7, -r * 0.7, r * 0.7, r * 0.7);
  grad.addColorStop(0, '#ef4444');
  grad.addColorStop(0.35, '#f59e0b');
  grad.addColorStop(0.8, '#eab308');
  grad.addColorStop(1, '#84cc16');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.85);
  ctx.bezierCurveTo(r * 0.75, -r * 0.9, r * 1.15, -r * 0.1, r * 0.6, r * 0.8);
  ctx.bezierCurveTo(r * 0.2, r * 1.05, -r * 0.6, r * 0.95, -r * 0.75, r * 0.3);
  ctx.bezierCurveTo(-r * 0.9, -r * 0.4, -r * 0.5, -r * 0.85, 0, -r * 0.85);
  ctx.closePath();
  ctx.fill();

  // Specular gleam
  ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.35, r * 0.16, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawKiwi(ctx: CanvasRenderingContext2D, r: number) {
  // Brown fuzzy oval skin
  const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
  grad.addColorStop(0, '#a16207');
  grad.addColorStop(0.7, '#78350f');
  grad.addColorStop(1, '#451a03');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.85, r, 0, 0, Math.PI * 2);
  ctx.fill();

  // Subtle fuzz rim
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Light gloss
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.25, -r * 0.25, r * 0.25, r * 0.12, -0.5, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draws the Bomb object with metallic cast iron texture, fuse, and sparking fire!
 */
export function drawBomb(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  sparkTime: number
) {
  ctx.save();
  ctx.rotate(angle);

  // 1. Dark cast iron sphere
  const grad = ctx.createRadialGradient(
    -radius * 0.35,
    -radius * 0.35,
    radius * 0.1,
    0,
    0,
    radius
  );
  grad.addColorStop(0, '#475569');
  grad.addColorStop(0.4, '#1e293b');
  grad.addColorStop(0.85, '#0f172a');
  grad.addColorStop(1, '#020617');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Metallic rim highlight
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Glowing skull / hazard mark on the bomb
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  // Skull shape
  ctx.arc(0, -radius * 0.1, radius * 0.28, 0, Math.PI * 2);
  ctx.rect(-radius * 0.15, radius * 0.1, radius * 0.3, radius * 0.15);
  ctx.fill();

  // Eye sockets
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-radius * 0.1, -radius * 0.12, radius * 0.08, 0, Math.PI * 2);
  ctx.arc(radius * 0.1, -radius * 0.12, radius * 0.08, 0, Math.PI * 2);
  ctx.fill();

  // Fuse collar (golden metal)
  ctx.fillStyle = '#d97706';
  ctx.beginPath();
  ctx.rect(-radius * 0.2, -radius * 1.08, radius * 0.4, radius * 0.2);
  ctx.fill();

  // Woven fuse cord
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -radius * 1.05);
  ctx.quadraticCurveTo(radius * 0.4, -radius * 1.35, radius * 0.25, -radius * 1.6);
  ctx.stroke();

  // Sparking burning fuse tip
  const sparkX = radius * 0.25;
  const sparkY = -radius * 1.6;

  // Fire glow
  const fireGrad = ctx.createRadialGradient(sparkX, sparkY, 1, sparkX, sparkY, 18);
  fireGrad.addColorStop(0, '#ffffff');
  fireGrad.addColorStop(0.3, '#fde047');
  fireGrad.addColorStop(0.7, '#f97316');
  fireGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');

  ctx.fillStyle = fireGrad;
  ctx.beginPath();
  ctx.arc(sparkX, sparkY, 18, 0, Math.PI * 2);
  ctx.fill();

  // Spitting sparks
  const sparkCount = 4;
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  for (let s = 0; s < sparkCount; s++) {
    const sAng = sparkTime * 15 + (s * Math.PI * 2) / sparkCount;
    const sLen = 8 + (Math.sin(sparkTime * 20 + s) * 5);
    ctx.beginPath();
    ctx.moveTo(sparkX, sparkY);
    ctx.lineTo(sparkX + Math.cos(sAng) * sLen, sparkY + Math.sin(sAng) * sLen);
    ctx.stroke();
  }

  ctx.restore();
}
