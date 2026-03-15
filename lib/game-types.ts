export interface Position {
  x: number
  y: number
}

export interface Velocity {
  x: number
  y: number
}

export interface GameObject extends Position {
  width: number
  height: number
  velocity?: Velocity
}

export interface Player extends GameObject {
  lives: number
  score: number
  isInvincible: boolean
  hasShield: boolean
  hasTripleShot: boolean
  hasSpeedBoost: boolean
  powerUpTimer: number
}

export interface Enemy extends GameObject {
  type: 'basic' | 'fast' | 'tank' | 'boss'
  health: number
  points: number
  shootTimer: number
  pattern: 'straight' | 'zigzag' | 'circle'
}

export interface Bullet extends GameObject {
  isPlayerBullet: boolean
  damage: number
  color: string
}

export interface PowerUp extends GameObject {
  type: 'shield' | 'tripleShot' | 'speedBoost' | 'extraLife' | 'bomb'
}

export interface Particle extends Position {
  velocity: Velocity
  life: number
  maxLife: number
  color: string
  size: number
}

export interface Star extends Position {
  size: number
  speed: number
  brightness: number
}

export interface GameState {
  player: Player
  enemies: Enemy[]
  bullets: Bullet[]
  powerUps: PowerUp[]
  particles: Particle[]
  stars: Star[]
  level: number
  gameStatus: 'menu' | 'playing' | 'paused' | 'gameOver'
  highScore: number
  combo: number
  comboTimer: number
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'GAME_OVER' }
  | { type: 'MOVE_PLAYER'; payload: { x: number; y: number } }
  | { type: 'SHOOT' }
  | { type: 'UPDATE_GAME'; payload: { deltaTime: number; canvasWidth: number; canvasHeight: number } }
  | { type: 'SPAWN_ENEMY'; payload: Enemy }
  | { type: 'SPAWN_POWERUP'; payload: PowerUp }
  | { type: 'COLLECT_POWERUP'; payload: { powerUpType: PowerUp['type'] } }
  | { type: 'USE_BOMB' }
  | { type: 'NEXT_LEVEL' }
  | { type: 'SET_HIGH_SCORE'; payload: number }
