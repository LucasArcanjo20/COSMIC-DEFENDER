"use client"

import { useEffect, useRef } from "react"
import type { GameState } from "@/lib/game-types"

interface GameCanvasProps {
  gameState: GameState
  width: number
  height: number
}

export function GameCanvas({ gameState, width, height }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Limpa o canvas
    ctx.fillStyle = "#0a0a1a"
    ctx.fillRect(0, 0, width, height)

    // Desenha estrelas (background)
    gameState.stars.forEach((star) => {
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`
      ctx.fill()
    })

    // Desenha grid de fundo (efeito cyberpunk)
    ctx.strokeStyle = "rgba(0, 255, 255, 0.05)"
    ctx.lineWidth = 1
    for (let i = 0; i < width; i += 50) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i < height; i += 50) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }

    // Desenha partículas
    gameState.particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
      ctx.fillStyle = particle.color
      ctx.globalAlpha = alpha
      ctx.fill()
      ctx.globalAlpha = 1
    })

    // Desenha power-ups
    gameState.powerUps.forEach((powerUp) => {
      const colors: Record<string, string> = {
        shield: "#00aaff",
        tripleShot: "#ff00ff",
        speedBoost: "#00ff00",
        extraLife: "#ff3366",
        bomb: "#ff6600",
      }

      const icons: Record<string, string> = {
        shield: "S",
        tripleShot: "T",
        speedBoost: "V",
        extraLife: "+",
        bomb: "B",
      }

      const color = colors[powerUp.type] || "#ffffff"

      // Glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = 15

      ctx.fillStyle = color
      ctx.beginPath()
      ctx.roundRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height, 8)
      ctx.fill()

      ctx.shadowBlur = 0
      ctx.fillStyle = "#000"
      ctx.font = "bold 16px Geist, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(icons[powerUp.type], powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2)
    })

    // Desenha inimigos
    gameState.enemies.forEach((enemy) => {
      const colors: Record<string, string> = {
        basic: "#ff3366",
        fast: "#ff9900",
        tank: "#9933ff",
        boss: "#ff00ff",
      }

      const color = colors[enemy.type] || "#ff3366"

      // Glow effect
      ctx.shadowColor = color
      ctx.shadowBlur = 10

      // Corpo do inimigo
      ctx.fillStyle = color
      ctx.beginPath()

      if (enemy.type === "boss") {
        // Boss tem design especial
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y)
        ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.3)
        ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height)
        ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height)
        ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.3)
        ctx.closePath()
      } else {
        // Outros inimigos
        ctx.moveTo(enemy.x + enemy.width / 2, enemy.y + enemy.height)
        ctx.lineTo(enemy.x + enemy.width, enemy.y)
        ctx.lineTo(enemy.x + enemy.width * 0.7, enemy.y + enemy.height * 0.4)
        ctx.lineTo(enemy.x + enemy.width * 0.3, enemy.y + enemy.height * 0.4)
        ctx.lineTo(enemy.x, enemy.y)
        ctx.closePath()
      }

      ctx.fill()

      // Barra de vida para tank e boss
      if ((enemy.type === "tank" || enemy.type === "boss") && enemy.health > 1) {
        const maxHealth = enemy.type === "boss" ? 10 : 3
        const healthPercent = enemy.health / maxHealth
        ctx.shadowBlur = 0
        ctx.fillStyle = "#333"
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width, 4)
        ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffff00" : "#ff0000"
        ctx.fillRect(enemy.x, enemy.y - 8, enemy.width * healthPercent, 4)
      }

      ctx.shadowBlur = 0
    })

    // Desenha tiros
    gameState.bullets.forEach((bullet) => {
      ctx.shadowColor = bullet.color
      ctx.shadowBlur = 8
      ctx.fillStyle = bullet.color

      if (bullet.isPlayerBullet) {
        // Tiro do jogador - formato de laser
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height)
        // Trail effect
        const gradient = ctx.createLinearGradient(bullet.x, bullet.y, bullet.x, bullet.y + bullet.height * 2)
        gradient.addColorStop(0, bullet.color)
        gradient.addColorStop(1, "transparent")
        ctx.fillStyle = gradient
        ctx.fillRect(bullet.x, bullet.y + bullet.height, bullet.width, bullet.height)
      } else {
        // Tiro do inimigo - formato circular
        ctx.beginPath()
        ctx.arc(bullet.x + bullet.width / 2, bullet.y + bullet.height / 2, bullet.width / 2 + 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.shadowBlur = 0
    })

    // Desenha jogador
    const { player } = gameState
    if (player.isInvincible) {
      // Efeito de invencibilidade (pisca)
      if (Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.globalAlpha = 0.5
      }
    }

    // Escudo
    if (player.hasShield) {
      ctx.shadowColor = "#00aaff"
      ctx.shadowBlur = 20
      ctx.strokeStyle = "#00aaff"
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    // Nave do jogador
    ctx.shadowColor = "#00ffff"
    ctx.shadowBlur = 15

    // Corpo principal
    const gradient = ctx.createLinearGradient(player.x, player.y + player.height, player.x, player.y)
    gradient.addColorStop(0, "#0066cc")
    gradient.addColorStop(0.5, "#00ccff")
    gradient.addColorStop(1, "#00ffff")
    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.moveTo(player.x + player.width / 2, player.y)
    ctx.lineTo(player.x + player.width, player.y + player.height)
    ctx.lineTo(player.x + player.width * 0.7, player.y + player.height * 0.7)
    ctx.lineTo(player.x + player.width * 0.3, player.y + player.height * 0.7)
    ctx.lineTo(player.x, player.y + player.height)
    ctx.closePath()
    ctx.fill()

    // Cockpit
    ctx.fillStyle = "#ffffff"
    ctx.beginPath()
    ctx.ellipse(player.x + player.width / 2, player.y + player.height * 0.4, 6, 10, 0, 0, Math.PI * 2)
    ctx.fill()

    // Propulsores
    ctx.shadowColor = "#ff6600"
    ctx.shadowBlur = 10
    const thrusterGradient = ctx.createLinearGradient(player.x, player.y + player.height, player.x, player.y + player.height + 20)
    thrusterGradient.addColorStop(0, "#ff6600")
    thrusterGradient.addColorStop(0.5, "#ffcc00")
    thrusterGradient.addColorStop(1, "transparent")
    ctx.fillStyle = thrusterGradient

    // Propulsor esquerdo
    ctx.beginPath()
    ctx.moveTo(player.x + player.width * 0.25, player.y + player.height)
    ctx.lineTo(player.x + player.width * 0.35, player.y + player.height)
    ctx.lineTo(player.x + player.width * 0.3, player.y + player.height + 15 + Math.random() * 5)
    ctx.closePath()
    ctx.fill()

    // Propulsor direito
    ctx.beginPath()
    ctx.moveTo(player.x + player.width * 0.65, player.y + player.height)
    ctx.lineTo(player.x + player.width * 0.75, player.y + player.height)
    ctx.lineTo(player.x + player.width * 0.7, player.y + player.height + 15 + Math.random() * 5)
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }, [gameState, width, height])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border-2 border-primary/30 shadow-[0_0_30px_rgba(0,255,255,0.3)]"
    />
  )
}
