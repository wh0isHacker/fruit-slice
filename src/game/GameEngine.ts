import { audioManager } from '../audio/AudioManager';
import {
  BombEntity,
  FruitEntity,
  FruitType,
  GameMode,
  GameOverStats,
  GameScreen,
  Point,
  SlicedHalfEntity,
} from '../types';
import { BladeTrail } from './BladeTrail';
import { checkSegmentCircleIntersection } from './collision';
import { FRUIT_CONFIGS, FRUIT_TYPES } from './fruitConfigs';
import { drawBomb, drawSlicedHalf, drawWholeFruit } from './fruitDrawers';
import { ParticleSystem } from './ParticleSystem';

export interface GameEngineCallbacks {
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onMissesChange: (misses: number) => void;
  onLevelChange: (level: number) => void;
  onTimeChange: (timeRemaining: number) => void;
  onGameOver: (stats: GameOverStats) => void;
  onCombo: (comboCount: number, comboBonus: number) => void;
  onFirstSlice?: () => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Screen dimensions
  private width: number = 0;
  private height: number = 0;
  private dpr: number = 1;

  // Game state
  public mode: GameMode = 'timed_1min';
  public state: GameScreen = 'menu';
  public score: number = 0;
  public lives: number = 3;
  public missedFruits: number = 0;
  public missesPerLife: number = 3;
  public level: number = 1;
  public timeRemaining: number = 60;
  public gameDuration: number = 60; // 60s for 1min, 120s for 2min, Infinity for classic
  public isFirstSliceMade: boolean = false;
  public fruitsSlicedCount: number = 0;
  public maxCombo: number = 0;

  // Timestamp-based accurate timer tracking (immune to framerate / lag)
  private timerStartTime: number | null = null;
  private pausedAccumulatedMs: number = 0;
  private pauseStartTimestamp: number | null = null;
  private countdownBeepsTriggered: Set<number> = new Set();
  public isTimesUpAnimating: boolean = false;
  private timesUpAnimationTimer: number = 0;

  // Entities
  private fruits: FruitEntity[] = [];
  private slicedHalves: SlicedHalfEntity[] = [];
  private bombs: BombEntity[] = [];
  private nextEntityId: number = 1;

  // Subsystems
  public bladeTrail: BladeTrail = new BladeTrail();
  public particles: ParticleSystem = new ParticleSystem();

  // Swipe input tracking
  private isSwiping: boolean = false;
  private lastSwipePoint: Point | null = null;

  // Combo system
  private currentCombo: number = 0;
  private lastSliceTime: number = 0;
  private readonly comboResetDelay: number = 0.42; // 420ms window for multi-slice combos

  // Spawner timing
  private spawnTimer: number = 0;
  private nextSpawnInterval: number = 1.6;
  private gameTime: number = 0;

  // Screen shake
  private screenShakeIntensity: number = 0;
  private screenShakeDecay: number = 8.0;

  // Screen flash
  private screenFlashAlpha: number = 0;

  // Animation frame
  private animationFrameId: number | null = null;
  private lastFrameTimestamp: number = 0;

  // Floating background fruits for the menu
  private menuFruits: {
    type: FruitType;
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    vRot: number;
    radius: number;
  }[] = [];

  constructor(canvas: HTMLCanvasElement, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Cannot get 2d context');
    this.ctx = context;
    this.callbacks = callbacks;

    this.handleResize();
    this.initMenuFruits();
    this.setupInputs();
  }

  public handleResize() {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    this.width = rect.width;
    this.height = rect.height;

    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  private initMenuFruits() {
    this.menuFruits = [];
    for (let i = 0; i < 7; i++) {
      const type = FRUIT_TYPES[i % FRUIT_TYPES.length];
      const cfg = FRUIT_CONFIGS[type];
      this.menuFruits.push({
        type,
        x: Math.random() * (this.width || 400),
        y: Math.random() * (this.height || 600),
        vx: (Math.random() - 0.5) * 45,
        vy: (Math.random() - 0.5) * 45,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 1.5,
        radius: cfg.radius * 0.9,
      });
    }
  }

  private setupInputs() {
    // Pointer/Touch/Mouse coordinates conversion
    const getCoords = (clientX: number, clientY: number): Point => {
      const rect = this.canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    // Touch events with touch-action prevention
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const p = getCoords(touch.clientX, touch.clientY);
        this.onPointerDown(p.x, p.y);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const p = getCoords(touch.clientX, touch.clientY);
        this.onPointerMove(p.x, p.y);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      this.onPointerUp();
    };

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => {
      const p = getCoords(e.clientX, e.clientY);
      this.onPointerDown(p.x, p.y);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const p = getCoords(e.clientX, e.clientY);
      this.onPointerMove(p.x, p.y);
    };

    const handleMouseUp = () => {
      this.onPointerUp();
    };

    this.canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    this.canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    this.canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  private onPointerDown(x: number, y: number) {
    this.isSwiping = true;
    const now = performance.now() / 1000;
    this.lastSwipePoint = { x, y };
    this.bladeTrail.addPoint(x, y, now);
  }

  private onPointerMove(x: number, y: number) {
    if (!this.isSwiping) return;

    const now = performance.now() / 1000;
    this.bladeTrail.addPoint(x, y, now);

    if (this.lastSwipePoint) {
      const dx = x - this.lastSwipePoint.x;
      const dy = y - this.lastSwipePoint.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Play whoosh when moving vigorously
      if (dist > 28) {
        audioManager.playWhoosh();
      }

      // If in preparation state and player swipes, activate timer
      if (!this.isFirstSliceMade && this.state === 'playing' && dist > 18) {
        this.startActiveGameplay();
      }

      // Check slicing collisions
      if (this.state === 'playing' && !this.isTimesUpAnimating) {
        this.checkIntersections(this.lastSwipePoint, { x, y });
      }
    }

    this.lastSwipePoint = { x, y };
  }

  private onPointerUp() {
    this.isSwiping = false;
    this.lastSwipePoint = null;
  }

  /**
   * Activates active gameplay and starts the accurate countdown timer on first swipe / slice
   */
  public startActiveGameplay() {
    if (this.isFirstSliceMade) return;
    this.isFirstSliceMade = true;
    this.timerStartTime = performance.now();
    this.pausedAccumulatedMs = 0;
    this.pauseStartTimestamp = null;
    this.countdownBeepsTriggered.clear();
    this.callbacks.onFirstSlice?.();

    // Start background music once active gameplay commences
    audioManager.startMusic();

    // Quicken initial spawn rate for seamless action
    this.spawnTimer = this.nextSpawnInterval * 0.7;
  }

  /**
   * Starts a new game session with selected game mode
   */
  public startGame(mode: GameMode) {
    this.mode = mode;
    this.state = 'playing';
    this.score = 0;
    this.lives = 3;
    this.missedFruits = 0;
    this.level = 1;
    this.gameDuration = mode === 'timed_1min' ? 60 : mode === 'timed_2min' ? 120 : Infinity;
    this.timeRemaining = this.gameDuration === Infinity ? 0 : this.gameDuration;
    this.isFirstSliceMade = false;
    this.fruitsSlicedCount = 0;
    this.maxCombo = 0;
    this.currentCombo = 0;
    this.timerStartTime = null;
    this.pausedAccumulatedMs = 0;
    this.pauseStartTimestamp = null;
    this.countdownBeepsTriggered.clear();
    this.isTimesUpAnimating = false;
    this.timesUpAnimationTimer = 0;

    this.gameTime = 0;
    this.spawnTimer = 0;
    this.nextSpawnInterval = 1.4;

    this.fruits = [];
    this.slicedHalves = [];
    this.bombs = [];
    this.particles.clear();
    this.bladeTrail.clear();

    this.callbacks.onScoreChange(this.score);
    this.callbacks.onLivesChange(this.lives);
    this.callbacks.onMissesChange(this.missedFruits);
    this.callbacks.onLevelChange(this.level);
    this.callbacks.onTimeChange(this.timeRemaining);

    // Spawn 1-2 calm, large introductory fruits with predictable trajectory for first slice
    this.spawnIntroFruit();
  }

  public pauseGame() {
    if (this.state === 'playing' && !this.isTimesUpAnimating) {
      this.state = 'paused';
      this.pauseStartTimestamp = performance.now();
      audioManager.stopMusic();
    }
  }

  public resumeGame() {
    if (this.state === 'paused') {
      this.state = 'playing';
      if (this.pauseStartTimestamp !== null) {
        this.pausedAccumulatedMs += performance.now() - this.pauseStartTimestamp;
        this.pauseStartTimestamp = null;
      }
      this.lastFrameTimestamp = performance.now();
      if (this.isFirstSliceMade) {
        audioManager.startMusic();
      }
    }
  }

  public goToMenu() {
    this.state = 'menu';
    this.fruits = [];
    this.slicedHalves = [];
    this.bombs = [];
    this.particles.clear();
    this.bladeTrail.clear();
    this.isTimesUpAnimating = false;
    audioManager.stopMusic();
  }

  public startLoop() {
    this.lastFrameTimestamp = performance.now();
    const tick = (timestamp: number) => {
      const dt = Math.min((timestamp - this.lastFrameTimestamp) / 1000, 0.1); // Clamp to prevent spiral
      this.lastFrameTimestamp = timestamp;

      this.update(dt);
      this.render();

      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  public stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Main game logic update
   */
  private update(dt: number) {
    const now = performance.now() / 1000;
    this.bladeTrail.update(now);

    if (this.state === 'menu') {
      // Animate gentle floating fruits on menu background
      for (const f of this.menuFruits) {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.angle += f.vRot * dt;

        // Bounce gently off edges
        if (f.x < f.radius && f.vx < 0) f.vx *= -1;
        if (f.x > this.width - f.radius && f.vx > 0) f.vx *= -1;
        if (f.y < f.radius && f.vy < 0) f.vy *= -1;
        if (f.y > this.height - f.radius && f.vy > 0) f.vy *= -1;
      }
      this.particles.update(dt);
      return;
    }

    if (this.state !== 'playing') {
      this.particles.update(dt);
      return;
    }

    // Handle "TIME'S UP!" dramatic freeze animation
    if (this.isTimesUpAnimating) {
      this.timesUpAnimationTimer -= dt;
      if (this.timesUpAnimationTimer <= 0) {
        this.isTimesUpAnimating = false;
        this.triggerGameOver(true);
      }
      this.particles.update(dt);
      return;
    }

    this.gameTime += dt;

    // Accurate timestamp-based countdown for timed modes
    if ((this.mode === 'timed_1min' || this.mode === 'timed_2min') && this.isFirstSliceMade && this.timerStartTime !== null) {
      const currentNow = performance.now();
      const elapsedSeconds = Math.max(0, (currentNow - this.timerStartTime - this.pausedAccumulatedMs) / 1000);
      const remaining = Math.max(0, this.gameDuration - elapsedSeconds);
      const ceilRemaining = Math.ceil(remaining);

      this.timeRemaining = ceilRemaining;
      this.callbacks.onTimeChange(ceilRemaining);

      // Countdown audio ticks for 5, 4, 3, 2, 1
      if (ceilRemaining <= 5 && ceilRemaining >= 1) {
        if (!this.countdownBeepsTriggered.has(ceilRemaining)) {
          this.countdownBeepsTriggered.add(ceilRemaining);
          audioManager.playCountdownTick(ceilRemaining);
        }
      }

      if (remaining <= 0) {
        this.triggerTimesUp();
        return;
      }
    }

    // Screen shake decay
    if (this.screenShakeIntensity > 0) {
      this.screenShakeIntensity = Math.max(0, this.screenShakeIntensity - this.screenShakeDecay * dt);
    }
    // Screen flash decay
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha = Math.max(0, this.screenFlashAlpha - 2.5 * dt);
    }

    // Combo timer expiration
    if (this.currentCombo > 0 && now - this.lastSliceTime > this.comboResetDelay) {
      if (this.currentCombo >= 2) {
        this.applyComboBonus(this.currentCombo);
      }
      this.currentCombo = 0;
    }

    // Dynamic Difficulty Progression
    this.updateDifficultyLevel();

    // Spawner logic
    if (!this.isFirstSliceMade) {
      // Keep introductory fruits available until first slice
      if (this.fruits.length === 0) {
        this.spawnTimer += dt;
        if (this.spawnTimer >= 0.5) {
          this.spawnTimer = 0;
          this.spawnIntroFruit();
        }
      }
    } else {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.nextSpawnInterval) {
        this.spawnTimer = 0;
        this.spawnWave();
      }
    }

    // Update Fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vy += f.gravity * dt;
      f.angle += f.vRot * dt;

      if (f.vy > 0) {
        f.maxHeightReached = true;
      }

      // Check if fruit fell off the bottom
      if (f.y - f.radius > this.height && f.maxHeightReached) {
        if (!f.isSliced && !f.hasMissed && this.isFirstSliceMade) {
          f.hasMissed = true;
          this.handleMissedFruit(f);
        }
        this.fruits.splice(i, 1);
      }
    }

    // Update Sliced Halves
    for (let i = this.slicedHalves.length - 1; i >= 0; i--) {
      const h = this.slicedHalves[i];
      h.x += h.vx * dt;
      h.y += h.vy * dt;
      h.vy += 980 * dt; // gravity
      h.angle += h.vRot * dt;
      h.lifetime += dt;

      if (h.lifetime > h.maxLifetime * 0.6) {
        h.opacity = Math.max(0, 1 - (h.lifetime - h.maxLifetime * 0.6) / (h.maxLifetime * 0.4));
      }

      if (h.lifetime >= h.maxLifetime || h.y - h.radius > this.height) {
        this.slicedHalves.splice(i, 1);
      }
    }

    // Update Bombs
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += b.gravity * dt;
      b.angle += b.vRot * dt;
      b.fuseSparkTime += dt;

      // Bombs falling off screen do NOT count as missed fruit
      if (b.y - b.radius > this.height && b.vy > 0) {
        this.bombs.splice(i, 1);
      }
    }

    // Update Particles & Floating Text
    this.particles.update(dt);
  }

  /**
   * Spawns an easy-to-slice, slow-moving introductory fruit before the first slice
   */
  private spawnIntroFruit() {
    const introTypes: FruitType[] = ['watermelon', 'orange', 'apple'];
    const type = introTypes[Math.floor(Math.random() * introTypes.length)];
    const cfg = FRUIT_CONFIGS[type];

    const startX = this.width * (0.38 + Math.random() * 0.24);
    const startY = this.height + cfg.radius + 15;
    const targetApexY = this.height * 0.35;
    const deltaY = startY - targetApexY;

    // Gentle gravity and velocity for smooth predictable arc
    const gravity = cfg.gravity * 0.72;
    const vy = -Math.sqrt(2 * gravity * deltaY);
    const centerOffset = this.width / 2 - startX;
    const vx = (centerOffset * 0.35) / (-vy / gravity);

    this.fruits.push({
      id: this.nextEntityId++,
      type,
      x: startX,
      y: startY,
      vx,
      vy,
      radius: cfg.radius * 1.12, // Slightly larger target for first slice
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 1.8,
      gravity,
      points: cfg.points,
      isRare: false,
      isSliced: false,
      hasMissed: false,
      spawnTime: performance.now(),
      maxHeightReached: false,
    });
  }

  /**
   * Difficulty progression based on time elapsed (for timed modes) or score (for classic)
   */
  private updateDifficultyLevel() {
    if (this.mode === 'timed_1min' || this.mode === 'timed_2min') {
      if (!this.isFirstSliceMade || this.timerStartTime === null) {
        this.level = 1;
        return;
      }
      const elapsed = Math.max(0, (performance.now() - this.timerStartTime - this.pausedAccumulatedMs) / 1000);
      const progress = Math.min(1.0, elapsed / this.gameDuration);

      let newLevel = 1;
      if (progress >= 0.75) {
        newLevel = 4; // 75%-100%: Fast action, combos, slight bomb frequency
      } else if (progress >= 0.50) {
        newLevel = 3; // 50%-75%: Faster fruits, more varied
      } else if (progress >= 0.25) {
        newLevel = 2; // 25%-50%: Medium speed
      } else {
        newLevel = 1; // 0%-25%: Easy, calm fruits
      }

      if (newLevel !== this.level) {
        this.level = newLevel;
        this.callbacks.onLevelChange(this.level);
      }
    } else {
      // Classic mode scales with score
      let newLevel = 1;
      if (this.score >= 1800) newLevel = 5;
      else if (this.score >= 1100) newLevel = 4;
      else if (this.score >= 600) newLevel = 3;
      else if (this.score >= 250) newLevel = 2;

      if (newLevel !== this.level) {
        this.level = newLevel;
        this.callbacks.onLevelChange(this.level);
      }
    }
  }

  /**
   * Spawns a randomized volley of fruits and occasional bombs
   */
  private spawnWave() {
    // Determine count based on difficulty level
    let minCount = 1;
    let maxCount = 2;
    let bombChance = 0.08;

    switch (this.level) {
      case 1:
        minCount = 1;
        maxCount = 2;
        bombChance = 0.04;
        this.nextSpawnInterval = 1.6 + Math.random() * 0.6;
        break;
      case 2:
        minCount = 1;
        maxCount = 3;
        bombChance = 0.12;
        this.nextSpawnInterval = 1.3 + Math.random() * 0.5;
        break;
      case 3:
        minCount = 2;
        maxCount = 4;
        bombChance = 0.18;
        this.nextSpawnInterval = 1.1 + Math.random() * 0.4;
        break;
      case 4:
        minCount = 2;
        maxCount = 5;
        bombChance = 0.24;
        this.nextSpawnInterval = 0.9 + Math.random() * 0.4;
        break;
      case 5:
      default:
        minCount = 3;
        maxCount = 5;
        bombChance = 0.32;
        this.nextSpawnInterval = 0.75 + Math.random() * 0.35;
        break;
    }

    const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1));

    for (let i = 0; i < count; i++) {
      // Slight delay between fruits in the same volley
      setTimeout(() => {
        if (this.state !== 'playing') return;
        this.spawnSingleFruit();
      }, i * (120 + Math.random() * 90));
    }

    // Occasional bomb (in Classic mode or Time Attack)
    if (Math.random() < bombChance && this.score > 40) {
      setTimeout(() => {
        if (this.state !== 'playing') return;
        this.spawnSingleBomb();
      }, Math.random() * 300);
    }
  }

  private spawnSingleFruit() {
    // Pick random fruit type
    const type = FRUIT_TYPES[Math.floor(Math.random() * FRUIT_TYPES.length)];
    const cfg = FRUIT_CONFIGS[type];

    // Trajectory calculations
    const spawnMargin = 60;
    const startX = spawnMargin + Math.random() * (this.width - spawnMargin * 2);
    const startY = this.height + cfg.radius;

    // Target apex around upper 25% - 45% of screen
    const targetApexY = this.height * (0.22 + Math.random() * 0.28);
    const deltaY = startY - targetApexY;

    // v^2 = 2 * g * deltaY
    const vy = -Math.sqrt(2 * cfg.gravity * deltaY);

    // Lateral velocity targeting towards screen center
    const centerOffset = this.width / 2 - startX;
    const vx = (centerOffset * (0.6 + Math.random() * 0.8)) / (-vy / cfg.gravity);

    this.fruits.push({
      id: this.nextEntityId++,
      type,
      x: startX,
      y: startY,
      vx,
      vy,
      radius: cfg.radius,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 4.5,
      gravity: cfg.gravity,
      points: cfg.points,
      isRare: cfg.isRare,
      isSliced: false,
      hasMissed: false,
      spawnTime: performance.now(),
      maxHeightReached: false,
    });
  }

  private spawnSingleBomb() {
    const bombRadius = 38;
    const spawnMargin = 80;
    const startX = spawnMargin + Math.random() * (this.width - spawnMargin * 2);
    const startY = this.height + bombRadius;

    const targetApexY = this.height * (0.28 + Math.random() * 0.26);
    const deltaY = startY - targetApexY;
    const gravity = 880;
    const vy = -Math.sqrt(2 * gravity * deltaY);

    const centerOffset = this.width / 2 - startX;
    const vx = (centerOffset * (0.5 + Math.random() * 0.7)) / (-vy / gravity);

    this.bombs.push({
      id: this.nextEntityId++,
      x: startX,
      y: startY,
      vx,
      vy,
      radius: bombRadius,
      angle: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 3.5,
      gravity,
      isExploded: false,
      fuseSparkTime: 0,
    });
  }

  /**
   * Collision checking for a swipe line segment
   */
  private checkIntersections(p1: Point, p2: Point) {
    if (this.isTimesUpAnimating || this.state !== 'playing') return;

    const now = performance.now() / 1000;
    let fruitsSlicedThisSwipe = 0;
    let hasRareSliced = false;

    // 1. Check Fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      if (f.isSliced) continue;

      const result = checkSegmentCircleIntersection(p1, p2, f.x, f.y, f.radius);
      if (result.hit) {
        f.isSliced = true;
        fruitsSlicedThisSwipe++;
        if (f.isRare) hasRareSliced = true;
        this.sliceFruit(f, result.sliceAngle, result.cutNormalX, result.cutNormalY);
        this.fruits.splice(i, 1);
      }
    }

    // 2. Check Bombs
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      if (b.isExploded) continue;

      const result = checkSegmentCircleIntersection(p1, p2, b.x, b.y, b.radius);
      if (result.hit) {
        b.isExploded = true;
        this.explodeBomb(b);
        this.bombs.splice(i, 1);
      }
    }

    if (fruitsSlicedThisSwipe > 0) {
      if (!this.isFirstSliceMade) {
        this.startActiveGameplay();
      }

      this.currentCombo += fruitsSlicedThisSwipe;
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo;
      }
      this.lastSliceTime = now;
      this.fruitsSlicedCount += fruitsSlicedThisSwipe;

      // Play immediate satisfying slicing sound (swish + slice with pitch variation)
      audioManager.playMultiSlice(fruitsSlicedThisSwipe, hasRareSliced);

      if (this.currentCombo >= 2) {
        audioManager.playCombo(this.currentCombo);
      }
    }
  }

  /**
   * Slices fruit into two halves with opposing impulse and creates juicy splash particles
   */
  private sliceFruit(
    fruit: FruitEntity,
    sliceAngle: number,
    normalX: number,
    normalY: number
  ) {
    const cfg = FRUIT_CONFIGS[fruit.type];

    // Score points
    this.score += fruit.points;
    this.callbacks.onScoreChange(this.score);

    // Pop up floating score
    this.particles.addFloatingText(
      `+${fruit.points}`,
      fruit.x,
      fruit.y - 10,
      fruit.isRare ? '#facc15' : '#ffffff',
      fruit.isRare
    );

    // Particle splash and background splat decal
    this.particles.spawnJuiceSplash(
      fruit.x,
      fruit.y,
      cfg.juiceColor,
      cfg.secondaryJuiceColor,
      sliceAngle,
      fruit.isRare ? 28 : 22
    );

    // Create 2 sliced halves pushed along normal to cut
    const pushSpeed = 160 + Math.random() * 80;

    // Half 1: Left / Negative normal
    this.slicedHalves.push({
      id: this.nextEntityId++,
      type: fruit.type,
      x: fruit.x - normalX * 8,
      y: fruit.y - normalY * 8,
      vx: fruit.vx * 0.4 - normalX * pushSpeed,
      vy: fruit.vy * 0.5 - normalY * pushSpeed - 60,
      angle: sliceAngle,
      vRot: -2.5 - Math.random() * 3.5,
      radius: fruit.radius,
      sliceAngle,
      isRightSide: false,
      opacity: 1.0,
      lifetime: 0,
      maxLifetime: 1.6,
    });

    // Half 2: Right / Positive normal
    this.slicedHalves.push({
      id: this.nextEntityId++,
      type: fruit.type,
      x: fruit.x + normalX * 8,
      y: fruit.y + normalY * 8,
      vx: fruit.vx * 0.4 + normalX * pushSpeed,
      vy: fruit.vy * 0.5 + normalY * pushSpeed - 60,
      angle: sliceAngle,
      vRot: 2.5 + Math.random() * 3.5,
      radius: fruit.radius,
      sliceAngle,
      isRightSide: true,
      opacity: 1.0,
      lifetime: 0,
      maxLifetime: 1.6,
    });
  }

  /**
   * Applies multi-fruit combo bonus points and animated announcements
   */
  private applyComboBonus(comboCount: number) {
    let bonus = 0;
    let label = '';

    if (comboCount === 2) {
      bonus = 20;
      label = '2x COMBO! +20';
    } else if (comboCount === 3) {
      bonus = 50;
      label = '3 FRUIT COMBO! +50';
    } else if (comboCount === 4) {
      bonus = 100;
      label = 'SUPER 4x COMBO! +100';
    } else if (comboCount >= 5) {
      bonus = 200;
      label = `${comboCount}x UNSTOPPABLE! +200`;
    }

    if (bonus > 0) {
      this.score += bonus;
      this.callbacks.onScoreChange(this.score);
      this.callbacks.onCombo(comboCount, bonus);

      // Central combo announcement text
      this.particles.addFloatingText(
        label,
        this.width / 2,
        this.height * 0.38,
        '#fde047',
        true
      );
    }
  }

  /**
   * Explodes a bomb, causes screen shake, flash, sound, and life or time penalty
   */
  private explodeBomb(bomb: BombEntity) {
    audioManager.playBombExplosion();

    // Trigger visual feedback
    this.screenShakeIntensity = 22;
    this.screenFlashAlpha = 0.7;

    // Explosive particles and shockwaves
    this.particles.spawnBombExplosion(bomb.x, bomb.y);

    if (this.mode === 'classic') {
      this.lives = Math.max(0, this.lives - 1);
      this.callbacks.onLivesChange(this.lives);

      if (this.lives <= 0) {
        this.triggerGameOver(false);
      }
    } else {
      // In timed modes: deduct 50 points and 5 seconds
      this.score = Math.max(0, this.score - 50);
      this.callbacks.onScoreChange(this.score);

      if (this.timerStartTime !== null) {
        // Accelerate timer by 5 seconds
        this.timerStartTime -= 5000;
      }

      this.particles.addFloatingText('-50 PTS & -5s!', bomb.x, bomb.y - 15, '#ef4444', true);
    }
  }

  /**
   * Handles fruit falling off screen unsliced
   */
  private handleMissedFruit(fruit: FruitEntity) {
    if (this.mode !== 'classic' || !this.isFirstSliceMade) return;

    this.missedFruits++;
    audioManager.playMiss();

    // Spawn tiny miss indicator text where it dropped
    this.particles.addFloatingText('MISS!', fruit.x, this.height - 35, '#f87171', false);

    // 3 missed fruits = lose 1 life
    if (this.missedFruits >= this.missesPerLife) {
      this.missedFruits = 0;
      this.lives = Math.max(0, this.lives - 1);
      this.callbacks.onLivesChange(this.lives);

      this.particles.addFloatingText('-1 LIFE!', this.width / 2, this.height * 0.35, '#ef4444', true);

      if (this.lives <= 0) {
        this.triggerGameOver(false);
      }
    }

    this.callbacks.onMissesChange(this.missedFruits);
  }

  /**
   * Triggers the dramatic "TIME'S UP!" freeze sequence
   */
  private triggerTimesUp() {
    if (this.isTimesUpAnimating || this.state === 'gameover') return;
    this.isTimesUpAnimating = true;
    this.timesUpAnimationTimer = 1.6; // 1.6s display before showing score modal
    this.isSwiping = false;

    audioManager.stopMusic();
    audioManager.playTimeUp();
  }

  private triggerGameOver(isTimesUp = false) {
    this.state = 'gameover';
    audioManager.stopMusic();

    if (!isTimesUp) {
      audioManager.playGameOver();
    }

    // Check if new high score for current game mode
    let key = 'fruit_slice_highscore_timed_1min';
    if (this.mode === 'timed_2min') key = 'fruit_slice_highscore_timed_2min';
    else if (this.mode === 'classic') key = 'fruit_slice_highscore_classic';

    const saved = parseInt(localStorage.getItem(key) || '0', 10);
    const isNew = this.score > saved;
    const bestScore = Math.max(this.score, saved);

    if (isNew) {
      localStorage.setItem(key, this.score.toString());
      audioManager.playNewHighScore();
    }

    const stats: GameOverStats = {
      score: this.score,
      bestScore,
      fruitsSliced: this.fruitsSlicedCount,
      maxCombo: this.maxCombo,
      isNewHighScore: isNew,
      isTimesUp,
      gameMode: this.mode,
    };

    this.callbacks.onGameOver(stats);
  }

  /**
   * Main render method
   */
  public render() {
    const ctx = this.ctx;
    const now = performance.now() / 1000;

    ctx.save();

    // Apply screen shake
    if (this.screenShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity * 2;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Draw Dojo Wood-Plank Background
    this.renderBackground(ctx);

    // 2. Render background juice splats
    this.particles.renderSplats(ctx);

    // 3. Render entities
    if (this.state === 'menu') {
      // Render floating menu fruits
      for (const mf of this.menuFruits) {
        ctx.save();
        ctx.translate(mf.x, mf.y);
        drawWholeFruit(ctx, mf.type, mf.radius, mf.angle);
        ctx.restore();
      }
    } else {
      // Render Sliced Halves
      for (const h of this.slicedHalves) {
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.angle);
        drawSlicedHalf(ctx, h.type, h.radius, h.isRightSide, h.opacity);
        ctx.restore();
      }

      // Render Whole Flying Fruits
      for (const f of this.fruits) {
        ctx.save();
        ctx.translate(f.x, f.y);
        drawWholeFruit(ctx, f.type, f.radius, f.angle);
        ctx.restore();
      }

      // Render Bombs
      for (const b of this.bombs) {
        ctx.save();
        ctx.translate(b.x, b.y);
        drawBomb(ctx, b.radius, b.angle, b.fuseSparkTime);
        ctx.restore();
      }
    }

    // 4. Render foreground particles (juice sprays, sparks, smoke)
    this.particles.renderParticles(ctx);

    // 5. Render blade slash trail
    this.bladeTrail.render(ctx, now);

    // 6. Render floating texts
    this.particles.renderFloatingTexts(ctx);

    // 7. Screen flash on bomb explosion
    if (this.screenFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 255, 255, ${this.screenFlashAlpha})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // 8. "SWIPE TO SLICE!" subtle arcade callout before first slice
    if (!this.isFirstSliceMade && this.state === 'playing') {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const pulse = 1.0 + Math.sin(now * 5.5) * 0.08;
      const badgeY = this.height * 0.22;

      ctx.font = `800 ${Math.round(24 * pulse)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      const text = 'SWIPE TO SLICE!';
      const textWidth = ctx.measureText(text).width;

      // Dark translucent pill with glowing border
      ctx.fillStyle = 'rgba(15, 12, 10, 0.72)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 2.5;

      const padX = 26;
      const padY = 12;
      const pillH = 42;
      const pillW = textWidth + padX * 2;
      ctx.beginPath();
      ctx.roundRect(
        this.width / 2 - pillW / 2,
        badgeY - pillH / 2,
        pillW,
        pillH,
        22
      );
      ctx.fill();
      ctx.stroke();

      // Gold text with warm glow
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 14;
      ctx.fillText(text, this.width / 2, badgeY);
      ctx.restore();
    }

    // 9. "TIME'S UP!" dramatic freeze banner
    if (this.isTimesUpAnimating) {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '900 52px "Impact", "Arial Black", sans-serif';

      // Dramatic red glow
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 24;
      ctx.fillStyle = '#ffffff';
      ctx.fillText("TIME'S UP!", this.width / 2, this.height * 0.45);

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.strokeText("TIME'S UP!", this.width / 2, this.height * 0.45);
      ctx.restore();
    }

    ctx.restore();
  }

  /**
   * Renders a warm wooden arcade cutting-board dojo background with plank dividers
   */
  private renderBackground(ctx: CanvasRenderingContext2D) {
    // Rich mahogany / walnut wood gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, '#2d1b11');
    bgGrad.addColorStop(0.5, '#24140d');
    bgGrad.addColorStop(1, '#1b0d07');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Subtle vertical wooden planks
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 2;
    const plankWidth = 85;
    for (let x = plankWidth; x < this.width; x += plankWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();

      // Highlight bevel edge
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.moveTo(x + 1, 0);
      ctx.lineTo(x + 1, this.height);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    }

    // Radial dark vignette around borders for arcade focus
    const vigGrad = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      this.width * 0.3,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.8
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');

    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}
