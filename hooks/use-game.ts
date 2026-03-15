"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { GameState, Player, Enemy, Bullet, PowerUp, Particle, Star } from "@/lib/game-types"

const PLAYER_SPEED = 8
const BULLET_SPEED = 12
const ENEMY_BULLET_SPEED = 6
const POWERUP_DURATION = 10000
const COMBO_DURATION = 2000

const createInitialPlayer = (canvasWidth: number, canvasHeight: number): Player => ({
  x: canvasWidth / 2 - 25,
  y: canvasHeight - 80,
  width: 50,
  height: 50,
  lives: 3,
  score: 0,
  isInvincible: false,
  hasShield: false,
  hasTripleShot: false,
  hasSpeedBoost: false,
  powerUpTimer: 0,
})

const createStars = (count: number, canvasWidth: number, canvasHeight: number): Star[] => {
  return Array.from({ length: count }, () => ({
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: Math.random() * 2 + 0.5,
    speed: Math.random() * 2 + 0.5,
    brightness: Math.random() * 0.5 + 0.5,
  }))
}

const createExplosion = (x: number, y: number, color: string, count: number = 10): Particle[] => {
  return Array.from({ length: count }, () => ({
    x,
    y,
    velocity: {
      x: (Math.random() - 0.5) * 8,
      y: (Math.random() - 0.5) * 8,
    },
    life: 1,
    maxLife: 1,
    color,
    size: Math.random() * 4 + 2,
  }))
}

export function useGame(canvasWidth: number, canvasHeight: number) {
  const [gameState, setGameState] = useState<GameState>({
    player: createInitialPlayer(canvasWidth, canvasHeight),
    enemies: [],
    bullets: [],
    powerUps: [],
    particles: [],
    stars: createStars(100, canvasWidth, canvasHeight),
    level: 1,
    gameStatus: "menu",
    highScore: 0,
    combo: 0,
    comboTimer: 0,
  })

  const keysPressed = useRef<Set<string>>(new Set())
  const lastShootTime = useRef(0)
  const lastEnemySpawn = useRef(0)
  const lastPowerUpSpawn = useRef(0)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  const spawnEnemy = useCallback(
    (level: number): Enemy => {
      const types: Enemy["type"][] = ["basic", "fast", "tank"]
      const patterns: Enemy["pattern"][] = ["straight", "zigzag", "circle"]

      const typeRoll = Math.random()
      let type: Enemy["type"]
      if (typeRoll < 0.5) type = "basic"
      else if (typeRoll < 0.8) type = "fast"
      else type = "tank"

      // Boss a cada 5 níveis
      if (level % 5 === 0 && Math.random() < 0.2) {
        type = "boss"
      }

      const enemyConfig = {
        basic: { width: 40, height: 40, health: 1, points: 100, speed: 2 },
        fast: { width: 30, height: 30, health: 1, points: 150, speed: 4 },
        tank: { width: 60, height: 60, health: 3, points: 300, speed: 1 },
        boss: { width: 100, height: 80, health: 10 + level, points: 1000, speed: 1 },
      }

      const config = enemyConfig[type]

      return {
        x: Math.random() * (canvasWidth - config.width),
        y: -config.height,
        width: config.width,
        height: config.height,
        velocity: { x: 0, y: config.speed + level * 0.2 },
        type,
        health: config.health,
        points: config.points,
        shootTimer: Math.random() * 2000,
        pattern: patterns[Math.floor(Math.random() * patterns.length)],
      }
    },
    [canvasWidth]
  )

  const spawnPowerUp = useCallback((): PowerUp => {
    const types: PowerUp["type"][] = ["shield", "tripleShot", "speedBoost", "extraLife", "bomb"]
    const type = types[Math.floor(Math.random() * types.length)]

    return {
      x: Math.random() * (canvasWidth - 30),
      y: -30,
      width: 30,
      height: 30,
      velocity: { x: 0, y: 2 },
      type,
    }
  }, [canvasWidth])

  const checkCollision = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }): boolean => {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y
  }

  const startGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      player: createInitialPlayer(canvasWidth, canvasHeight),
      enemies: [],
      bullets: [],
      powerUps: [],
      particles: [],
      level: 1,
      gameStatus: "playing",
      combo: 0,
      comboTimer: 0,
    }))
    lastShootTime.current = 0
    lastEnemySpawn.current = 0
    lastPowerUpSpawn.current = 0
  }, [canvasWidth, canvasHeight])

  const pauseGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, gameStatus: "paused" }))
  }, [])

  const resumeGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, gameStatus: "playing" }))
  }, [])

  const shoot = useCallback(() => {
    const now = Date.now()
    if (now - lastShootTime.current < 200) return

    lastShootTime.current = now

    setGameState((prev) => {
      if (prev.gameStatus !== "playing") return prev

      const bullets: Bullet[] = []
      const { player } = prev

      if (player.hasTripleShot) {
        bullets.push(
          {
            x: player.x + player.width / 2 - 3,
            y: player.y,
            width: 6,
            height: 15,
            velocity: { x: 0, y: -BULLET_SPEED },
            isPlayerBullet: true,
            damage: 1,
            color: "#00ffff",
          },
          {
            x: player.x + player.width / 2 - 3 - 15,
            y: player.y + 10,
            width: 6,
            height: 15,
            velocity: { x: -2, y: -BULLET_SPEED },
            isPlayerBullet: true,
            damage: 1,
            color: "#00ffff",
          },
          {
            x: player.x + player.width / 2 - 3 + 15,
            y: player.y + 10,
            width: 6,
            height: 15,
            velocity: { x: 2, y: -BULLET_SPEED },
            isPlayerBullet: true,
            damage: 1,
            color: "#00ffff",
          }
        )
      } else {
        bullets.push({
          x: player.x + player.width / 2 - 3,
          y: player.y,
          width: 6,
          height: 15,
          velocity: { x: 0, y: -BULLET_SPEED },
          isPlayerBullet: true,
          damage: 1,
          color: "#00ffff",
        })
      }

      return { ...prev, bullets: [...prev.bullets, ...bullets] }
    })
  }, [])

  const useBomb = useCallback(() => {
    setGameState((prev) => {
      if (prev.gameStatus !== "playing") return prev

      // Destroi todos os inimigos na tela
      const particles: Particle[] = []
      let scoreGain = 0

      prev.enemies.forEach((enemy) => {
        particles.push(...createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ff6600", 15))
        scoreGain += enemy.points
      })

      return {
        ...prev,
        enemies: [],
        bullets: prev.bullets.filter((b) => b.isPlayerBullet),
        particles: [...prev.particles, ...particles],
        player: {
          ...prev.player,
          score: prev.player.score + scoreGain,
        },
      }
    })
  }, [])

  const updateGame = useCallback(
    (deltaTime: number) => {
      setGameState((prev) => {
        if (prev.gameStatus !== "playing") return prev

        let newPlayer = { ...prev.player }
        let newEnemies = [...prev.enemies]
        let newBullets = [...prev.bullets]
        let newPowerUps = [...prev.powerUps]
        let newParticles = [...prev.particles]
        let newStars = [...prev.stars]
        let newLevel = prev.level
        let newCombo = prev.combo
        let newComboTimer = prev.comboTimer
        let newHighScore = prev.highScore

        // Movimento do jogador
        const speed = newPlayer.hasSpeedBoost ? PLAYER_SPEED * 1.5 : PLAYER_SPEED
        if (keysPressed.current.has("ArrowLeft") || keysPressed.current.has("a")) {
          newPlayer.x = Math.max(0, newPlayer.x - speed)
        }
        if (keysPressed.current.has("ArrowRight") || keysPressed.current.has("d")) {
          newPlayer.x = Math.min(canvasWidth - newPlayer.width, newPlayer.x + speed)
        }
        if (keysPressed.current.has("ArrowUp") || keysPressed.current.has("w")) {
          newPlayer.y = Math.max(0, newPlayer.y - speed)
        }
        if (keysPressed.current.has("ArrowDown") || keysPressed.current.has("s")) {
          newPlayer.y = Math.min(canvasHeight - newPlayer.height, newPlayer.y + speed)
        }

        // Atualiza power-up timer
        if (newPlayer.powerUpTimer > 0) {
          newPlayer.powerUpTimer -= deltaTime
          if (newPlayer.powerUpTimer <= 0) {
            newPlayer.hasShield = false
            newPlayer.hasTripleShot = false
            newPlayer.hasSpeedBoost = false
          }
        }

        // Atualiza combo timer
        if (newComboTimer > 0) {
          newComboTimer -= deltaTime
          if (newComboTimer <= 0) {
            newCombo = 0
          }
        }

        // Atualiza estrelas (parallax)
        newStars = newStars.map((star) => ({
          ...star,
          y: (star.y + star.speed) % canvasHeight,
        }))

        // Atualiza inimigos
        newEnemies = newEnemies
          .map((enemy) => {
            let newX = enemy.x
            let newY = enemy.y + (enemy.velocity?.y || 2)

            // Padrões de movimento
            if (enemy.pattern === "zigzag") {
              newX += Math.sin(newY * 0.05) * 3
            } else if (enemy.pattern === "circle") {
              newX += Math.cos(newY * 0.03) * 2
            }

            // Tiro do inimigo
            let newShootTimer = enemy.shootTimer - deltaTime
            if (newShootTimer <= 0 && enemy.y > 0) {
              newBullets.push({
                x: enemy.x + enemy.width / 2 - 3,
                y: enemy.y + enemy.height,
                width: 6,
                height: 12,
                velocity: { x: 0, y: ENEMY_BULLET_SPEED },
                isPlayerBullet: false,
                damage: 1,
                color: enemy.type === "boss" ? "#ff00ff" : "#ff3333",
              })
              newShootTimer = enemy.type === "boss" ? 500 : 2000 + Math.random() * 1000
            }

            return {
              ...enemy,
              x: Math.max(0, Math.min(canvasWidth - enemy.width, newX)),
              y: newY,
              shootTimer: newShootTimer,
            }
          })
          .filter((enemy) => enemy.y < canvasHeight + 50)

        // Atualiza tiros
        newBullets = newBullets
          .map((bullet) => ({
            ...bullet,
            x: bullet.x + (bullet.velocity?.x || 0),
            y: bullet.y + (bullet.velocity?.y || 0),
          }))
          .filter((bullet) => bullet.y > -20 && bullet.y < canvasHeight + 20 && bullet.x > -20 && bullet.x < canvasWidth + 20)

        // Atualiza power-ups
        newPowerUps = newPowerUps
          .map((powerUp) => ({
            ...powerUp,
            y: powerUp.y + (powerUp.velocity?.y || 2),
          }))
          .filter((powerUp) => powerUp.y < canvasHeight + 50)

        // Atualiza partículas
        newParticles = newParticles
          .map((particle) => ({
            ...particle,
            x: particle.x + particle.velocity.x,
            y: particle.y + particle.velocity.y,
            life: particle.life - deltaTime / 1000,
            velocity: {
              x: particle.velocity.x * 0.98,
              y: particle.velocity.y * 0.98,
            },
          }))
          .filter((particle) => particle.life > 0)

        // Colisão: tiros do jogador com inimigos
        newBullets = newBullets.filter((bullet) => {
          if (!bullet.isPlayerBullet) return true

          for (let i = 0; i < newEnemies.length; i++) {
            if (checkCollision(bullet, newEnemies[i])) {
              newEnemies[i].health -= bullet.damage

              if (newEnemies[i].health <= 0) {
                // Inimigo destruído
                newParticles.push(
                  ...createExplosion(
                    newEnemies[i].x + newEnemies[i].width / 2,
                    newEnemies[i].y + newEnemies[i].height / 2,
                    newEnemies[i].type === "boss" ? "#ff00ff" : "#00ffff",
                    newEnemies[i].type === "boss" ? 30 : 15
                  )
                )

                // Combo system
                newCombo++
                newComboTimer = COMBO_DURATION
                const comboMultiplier = Math.min(newCombo, 10)

                newPlayer.score += newEnemies[i].points * comboMultiplier
                newEnemies.splice(i, 1)
              } else {
                // Hit effect
                newParticles.push(...createExplosion(bullet.x, bullet.y, "#ffffff", 3))
              }

              return false
            }
          }
          return true
        })

        // Colisão: tiros inimigos com jogador
        if (!newPlayer.isInvincible && !newPlayer.hasShield) {
          newBullets = newBullets.filter((bullet) => {
            if (bullet.isPlayerBullet) return true

            if (checkCollision(bullet, newPlayer)) {
              newPlayer.lives--
              newPlayer.isInvincible = true
              newParticles.push(...createExplosion(newPlayer.x + newPlayer.width / 2, newPlayer.y + newPlayer.height / 2, "#ff6600", 20))

              setTimeout(() => {
                setGameState((s) => ({
                  ...s,
                  player: { ...s.player, isInvincible: false },
                }))
              }, 2000)

              if (newPlayer.lives <= 0) {
                if (newPlayer.score > newHighScore) {
                  newHighScore = newPlayer.score
                }
                return { ...prev, gameStatus: "gameOver" as const, player: newPlayer, highScore: newHighScore }
              }

              return false
            }
            return true
          })
        }

        // Colisão: inimigos com jogador
        if (!newPlayer.isInvincible && !newPlayer.hasShield) {
          for (const enemy of newEnemies) {
            if (checkCollision(enemy, newPlayer)) {
              newPlayer.lives--
              newPlayer.isInvincible = true
              newParticles.push(...createExplosion(newPlayer.x + newPlayer.width / 2, newPlayer.y + newPlayer.height / 2, "#ff6600", 20))

              setTimeout(() => {
                setGameState((s) => ({
                  ...s,
                  player: { ...s.player, isInvincible: false },
                }))
              }, 2000)

              if (newPlayer.lives <= 0) {
                if (newPlayer.score > newHighScore) {
                  newHighScore = newPlayer.score
                }
                return { ...prev, gameStatus: "gameOver" as const, player: newPlayer, highScore: newHighScore }
              }
              break
            }
          }
        }

        // Colisão: power-ups com jogador
        newPowerUps = newPowerUps.filter((powerUp) => {
          if (checkCollision(powerUp, newPlayer)) {
            newParticles.push(...createExplosion(powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2, "#ffff00", 10))

            switch (powerUp.type) {
              case "shield":
                newPlayer.hasShield = true
                newPlayer.powerUpTimer = POWERUP_DURATION
                break
              case "tripleShot":
                newPlayer.hasTripleShot = true
                newPlayer.powerUpTimer = POWERUP_DURATION
                break
              case "speedBoost":
                newPlayer.hasSpeedBoost = true
                newPlayer.powerUpTimer = POWERUP_DURATION
                break
              case "extraLife":
                newPlayer.lives = Math.min(newPlayer.lives + 1, 5)
                break
              case "bomb":
                // Efeito de bomba aplicado imediatamente
                newEnemies.forEach((enemy) => {
                  newParticles.push(...createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, "#ff6600", 15))
                  newPlayer.score += enemy.points
                })
                newEnemies = []
                newBullets = newBullets.filter((b) => b.isPlayerBullet)
                break
            }

            return false
          }
          return true
        })

        // Level up baseado na pontuação
        const levelThreshold = newLevel * 5000
        if (newPlayer.score >= levelThreshold) {
          newLevel++
          newParticles.push(...createExplosion(canvasWidth / 2, canvasHeight / 2, "#00ff00", 50))
        }

        return {
          ...prev,
          player: newPlayer,
          enemies: newEnemies,
          bullets: newBullets,
          powerUps: newPowerUps,
          particles: newParticles,
          stars: newStars,
          level: newLevel,
          combo: newCombo,
          comboTimer: newComboTimer,
          highScore: newHighScore,
        }
      })
    },
    [canvasWidth, canvasHeight]
  )

  // Spawn de inimigos
  useEffect(() => {
    if (gameState.gameStatus !== "playing") return

    const spawnInterval = setInterval(() => {
      const now = Date.now()
      const spawnRate = Math.max(500, 2000 - gameState.level * 100)

      if (now - lastEnemySpawn.current > spawnRate) {
        lastEnemySpawn.current = now
        const enemy = spawnEnemy(gameState.level)
        setGameState((prev) => ({
          ...prev,
          enemies: [...prev.enemies, enemy],
        }))
      }

      // Spawn power-up ocasional
      if (now - lastPowerUpSpawn.current > 10000 && Math.random() < 0.3) {
        lastPowerUpSpawn.current = now
        const powerUp = spawnPowerUp()
        setGameState((prev) => ({
          ...prev,
          powerUps: [...prev.powerUps, powerUp],
        }))
      }
    }, 100)

    return () => clearInterval(spawnInterval)
  }, [gameState.gameStatus, gameState.level, spawnEnemy, spawnPowerUp])

  // Game loop
  useEffect(() => {
    if (gameState.gameStatus !== "playing") {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      return
    }

    const gameLoop = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp
      }

      const deltaTime = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      updateGame(deltaTime)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameState.gameStatus, updateGame])

  // Controles do teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase())

      if (e.key === " " || e.key === "Space") {
        e.preventDefault()
        shoot()
      }

      if (e.key === "Escape") {
        if (gameState.gameStatus === "playing") {
          pauseGame()
        } else if (gameState.gameStatus === "paused") {
          resumeGame()
        }
      }

      if (e.key === "b" || e.key === "B") {
        useBomb()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameState.gameStatus, shoot, pauseGame, resumeGame, useBomb])

  // Controle contínuo de tiro
  useEffect(() => {
    if (gameState.gameStatus !== "playing") return

    const shootInterval = setInterval(() => {
      if (keysPressed.current.has(" ")) {
        shoot()
      }
    }, 150)

    return () => clearInterval(shootInterval)
  }, [gameState.gameStatus, shoot])

  return {
    gameState,
    startGame,
    pauseGame,
    resumeGame,
    shoot,
    useBomb,
  }
}
