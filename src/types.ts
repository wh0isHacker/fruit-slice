export type GameMode = 'timed_1min' | 'timed_2min' | 'classic';

export type GameScreen = 'menu' | 'prep' | 'playing' | 'paused' | 'gameover';

export type FruitType =
  | 'apple'
  | 'watermelon'
  | 'orange'
  | 'banana'
  | 'pineapple'
  | 'strawberry'
  | 'mango'
  | 'kiwi';

export type BladeStyle = 'cyan' | 'flame' | 'emerald' | 'rainbow' | 'violet';

export interface FruitConfig {
  type: FruitType;
  name: string;
  radius: number;
  points: number;
  isRare: boolean;
  gravity: number;
  juiceColor: string;
  secondaryJuiceColor: string;
  fleshColor: string;
  skinColor: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface SwipePoint extends Point {
  time: number;
}

export interface FruitEntity {
  id: number;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  vRot: number;
  gravity: number;
  points: number;
  isRare: boolean;
  isSliced: boolean;
  hasMissed: boolean;
  spawnTime: number;
  maxHeightReached: boolean;
}

export interface SlicedHalfEntity {
  id: number;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  vRot: number;
  radius: number;
  sliceAngle: number;
  isRightSide: boolean;
  opacity: number;
  lifetime: number;
  maxLifetime: number;
}

export interface BombEntity {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  vRot: number;
  gravity: number;
  isExploded: boolean;
  fuseSparkTime: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  type?: 'juice' | 'spark' | 'smoke' | 'ring';
  maxRadius?: number;
}

export interface SplatDecal {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  rotation: number;
  blots: { dx: number; dy: number; r: number }[];
}

export interface FloatingTextEntity {
  id: number;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  scale: number;
  alpha: number;
  lifetime: number;
  maxLifetime: number;
  isCombo?: boolean;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  soundVolume: number;
  musicVolume: number;
  bladeStyle: BladeStyle;
  missesPerLife: number; // default 3
}

export interface HighScoreRecord {
  timed_1min: number;
  timed_2min: number;
  classic: number;
}

export interface GameOverStats {
  score: number;
  bestScore: number;
  fruitsSliced: number;
  maxCombo: number;
  isNewHighScore: boolean;
  isTimesUp: boolean;
  gameMode: GameMode;
}
