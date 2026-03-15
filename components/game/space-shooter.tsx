"use client"

import { useEffect, useState, useRef } from "react"
import { useGame } from "@/hooks/use-game"
import { GameCanvas } from "./game-canvas"
import { GameUI, GameOverlay } from "./game-ui"

const GAME_WIDTH = 800
const GAME_HEIGHT = 600

export function SpaceShooter() {
  const [dimensions, setDimensions] = useState({ width: GAME_WIDTH, height: GAME_HEIGHT })
  const [isMounted, setIsMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { gameState, startGame, pauseGame, resumeGame } = useGame(dimensions.width, dimensions.height)

  // Ajusta dimensões responsivamente
  useEffect(() => {
    setIsMounted(true)

    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth
        const maxWidth = Math.min(containerWidth - 32, GAME_WIDTH)
        const aspectRatio = GAME_HEIGHT / GAME_WIDTH
        const newWidth = maxWidth
        const newHeight = maxWidth * aspectRatio

        setDimensions({ width: newWidth, height: newHeight })
      }
    }

    updateDimensions()
    window.addEventListener("resize", updateDimensions)

    return () => window.removeEventListener("resize", updateDimensions)
  }, [])

  // Salva high score no localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHighScore = localStorage.getItem("cosmicDefenderHighScore")
      if (savedHighScore && parseInt(savedHighScore) > gameState.highScore) {
        // Poderia atualizar o estado aqui se necessário
      }
    }
  }, [gameState.highScore])

  useEffect(() => {
    if (typeof window !== "undefined" && gameState.highScore > 0) {
      localStorage.setItem("cosmicDefenderHighScore", gameState.highScore.toString())
    }
  }, [gameState.highScore])

  if (!isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Título */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          <span className="text-primary neon-text">COSMIC</span>{" "}
          <span className="text-secondary neon-text">DEFENDER</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Use as setas ou WASD para mover, Espaço para atirar</p>
      </div>

      {/* Container do jogo */}
      <div
        className="relative"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* Canvas do jogo */}
        <GameCanvas gameState={gameState} width={dimensions.width} height={dimensions.height} />

        {/* UI do jogo (quando jogando) */}
        {gameState.gameStatus === "playing" && (
          <GameUI gameState={gameState} onPause={pauseGame} onResume={resumeGame} />
        )}

        {/* Overlays */}
        {gameState.gameStatus === "menu" && (
          <GameOverlay
            type="menu"
            highScore={gameState.highScore}
            onStart={startGame}
          />
        )}

        {gameState.gameStatus === "paused" && (
          <GameOverlay
            type="paused"
            score={gameState.player.score}
            level={gameState.level}
            onStart={startGame}
            onResume={resumeGame}
          />
        )}

        {gameState.gameStatus === "gameOver" && (
          <GameOverlay
            type="gameOver"
            score={gameState.player.score}
            highScore={gameState.highScore}
            level={gameState.level}
            onStart={startGame}
          />
        )}
      </div>

      {/* Controles mobile */}
      <div className="mt-6 md:hidden">
        <MobileControls gameState={gameState} />
      </div>

      {/* Créditos */}
      <div className="mt-8 text-center text-muted-foreground text-xs">
        <p>Desenvolvido por Lucas Arcanjo</p>
      </div>
    </div>
  )
}

function MobileControls({ gameState }: { gameState: ReturnType<typeof useGame>["gameState"] }) {
  const simulateKeyPress = (key: string, type: "down" | "up") => {
    const event = new KeyboardEvent(type === "down" ? "keydown" : "keyup", {
      key,
      bubbles: true,
    })
    window.dispatchEvent(event)
  }

  if (gameState.gameStatus !== "playing") return null

  return (
    <div className="flex flex-col items-center gap-4">
      {/* D-Pad */}
      <div className="grid grid-cols-3 gap-1">
        <div />
        <button
          className="w-14 h-14 bg-card border border-primary/30 rounded-lg active:bg-primary/20 flex items-center justify-center"
          onTouchStart={() => simulateKeyPress("ArrowUp", "down")}
          onTouchEnd={() => simulateKeyPress("ArrowUp", "up")}
        >
          <span className="text-2xl">↑</span>
        </button>
        <div />

        <button
          className="w-14 h-14 bg-card border border-primary/30 rounded-lg active:bg-primary/20 flex items-center justify-center"
          onTouchStart={() => simulateKeyPress("ArrowLeft", "down")}
          onTouchEnd={() => simulateKeyPress("ArrowLeft", "up")}
        >
          <span className="text-2xl">←</span>
        </button>
        <div />
        <button
          className="w-14 h-14 bg-card border border-primary/30 rounded-lg active:bg-primary/20 flex items-center justify-center"
          onTouchStart={() => simulateKeyPress("ArrowRight", "down")}
          onTouchEnd={() => simulateKeyPress("ArrowRight", "up")}
        >
          <span className="text-2xl">→</span>
        </button>

        <div />
        <button
          className="w-14 h-14 bg-card border border-primary/30 rounded-lg active:bg-primary/20 flex items-center justify-center"
          onTouchStart={() => simulateKeyPress("ArrowDown", "down")}
          onTouchEnd={() => simulateKeyPress("ArrowDown", "up")}
        >
          <span className="text-2xl">↓</span>
        </button>
        <div />
      </div>

      {/* Botão de tiro */}
      <button
        className="w-20 h-20 bg-destructive/80 border-2 border-destructive rounded-full active:bg-destructive flex items-center justify-center text-destructive-foreground font-bold"
        onTouchStart={() => simulateKeyPress(" ", "down")}
        onTouchEnd={() => simulateKeyPress(" ", "up")}
      >
        TIRO
      </button>
    </div>
  )
}
