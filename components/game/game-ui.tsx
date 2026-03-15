"use client"

import { Heart, Shield, Zap, Target, Bomb, Trophy, Star, Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { GameState } from "@/lib/game-types"

interface GameUIProps {
  gameState: GameState
  onPause: () => void
  onResume: () => void
}

export function GameUI({ gameState, onPause, onResume }: GameUIProps) {
  const { player, level, combo, comboTimer } = gameState

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Barra superior */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start pointer-events-auto">
        {/* Pontuação e nível */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/30">
            <Trophy className="w-5 h-5 text-accent" />
            <span className="font-mono text-xl font-bold text-foreground neon-text">
              {player.score.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-primary/30">
            <Star className="w-4 h-4 text-secondary" />
            <span className="font-mono text-sm text-foreground">
              Nível {level}
            </span>
          </div>

          {combo > 1 && comboTimer > 0 && (
            <div className="flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-accent/50 animate-pulse">
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-mono text-sm font-bold text-accent">
                COMBO x{Math.min(combo, 10)}!
              </span>
            </div>
          )}
        </div>

        {/* Botão de pausa */}
        <Button
          variant="outline"
          size="icon"
          onClick={gameState.gameStatus === "paused" ? onResume : onPause}
          className="bg-card/80 backdrop-blur-sm border-primary/30 hover:bg-primary/20"
        >
          {gameState.gameStatus === "paused" ? (
            <Play className="w-5 h-5 text-primary" />
          ) : (
            <Pause className="w-5 h-5 text-primary" />
          )}
        </Button>
      </div>

      {/* Barra inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-between items-end">
        {/* Vidas */}
        <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-primary/30">
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-6 h-6 transition-all duration-300 ${
                i < player.lives
                  ? "text-destructive fill-destructive"
                  : "text-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Power-ups ativos */}
        <div className="flex items-center gap-2">
          {player.hasShield && (
            <div className="flex items-center gap-1 bg-blue-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-blue-400/50">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="font-mono text-xs text-blue-400">Escudo</span>
            </div>
          )}
          {player.hasTripleShot && (
            <div className="flex items-center gap-1 bg-fuchsia-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-fuchsia-400/50">
              <Target className="w-4 h-4 text-fuchsia-400" />
              <span className="font-mono text-xs text-fuchsia-400">Triplo</span>
            </div>
          )}
          {player.hasSpeedBoost && (
            <div className="flex items-center gap-1 bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-green-400/50">
              <Zap className="w-4 h-4 text-green-400" />
              <span className="font-mono text-xs text-green-400">Veloz</span>
            </div>
          )}
        </div>
      </div>

      {/* Instruções no canto */}
      <div className="absolute bottom-4 right-4 text-right">
        <div className="bg-card/60 backdrop-blur-sm px-3 py-2 rounded-lg border border-border/50 text-xs text-muted-foreground">
          <p>Setas/WASD: Mover</p>
          <p>Espaço: Atirar</p>
          <p>ESC: Pausar</p>
        </div>
      </div>
    </div>
  )
}

interface GameOverlayProps {
  type: "menu" | "paused" | "gameOver"
  score?: number
  highScore?: number
  level?: number
  onStart: () => void
  onResume?: () => void
}

export function GameOverlay({ type, score = 0, highScore = 0, level = 1, onStart, onResume }: GameOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-10">
      <div className="text-center space-y-8 p-8">
        {type === "menu" && (
          <>
            <div className="space-y-2">
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
                <span className="text-primary neon-text">COSMIC</span>
                <br />
                <span className="text-secondary neon-text">DEFENDER</span>
              </h1>
              <p className="text-muted-foreground text-lg">Defenda a galáxia contra a invasão alienígena</p>
            </div>

            <div className="space-y-4">
              <Button
                size="lg"
                onClick={onStart}
                className="w-full md:w-64 h-14 text-lg font-bold bg-primary hover:bg-primary/80 text-primary-foreground neon-box"
              >
                <Play className="w-6 h-6 mr-2" />
                INICIAR JOGO
              </Button>

              {highScore > 0 && (
                <div className="flex items-center justify-center gap-2 text-accent">
                  <Trophy className="w-5 h-5" />
                  <span className="font-mono">Recorde: {highScore.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-sm">
              <div className="bg-card/50 p-4 rounded-lg border border-border">
                <Shield className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="font-medium text-foreground">Escudo</p>
                <p className="text-muted-foreground text-xs">Proteção temporária</p>
              </div>
              <div className="bg-card/50 p-4 rounded-lg border border-border">
                <Target className="w-8 h-8 mx-auto mb-2 text-fuchsia-400" />
                <p className="font-medium text-foreground">Tiro Triplo</p>
                <p className="text-muted-foreground text-xs">3x poder de fogo</p>
              </div>
              <div className="bg-card/50 p-4 rounded-lg border border-border">
                <Zap className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="font-medium text-foreground">Velocidade</p>
                <p className="text-muted-foreground text-xs">Movimento rápido</p>
              </div>
              <div className="bg-card/50 p-4 rounded-lg border border-border">
                <Bomb className="w-8 h-8 mx-auto mb-2 text-orange-400" />
                <p className="font-medium text-foreground">Bomba</p>
                <p className="text-muted-foreground text-xs">Limpa a tela</p>
              </div>
            </div>
          </>
        )}

        {type === "paused" && (
          <>
            <div className="space-y-2">
              <h2 className="text-5xl font-bold text-primary neon-text">PAUSADO</h2>
              <p className="text-muted-foreground">O jogo está pausado</p>
            </div>

            <div className="space-y-3">
              <Button
                size="lg"
                onClick={onResume}
                className="w-full md:w-64 h-12 text-lg font-bold bg-primary hover:bg-primary/80 text-primary-foreground"
              >
                <Play className="w-5 h-5 mr-2" />
                CONTINUAR
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={onStart}
                className="w-full md:w-64 h-12 text-lg font-medium border-destructive/50 text-destructive hover:bg-destructive/10"
              >
                REINICIAR
              </Button>
            </div>

            <div className="flex justify-center gap-8 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground font-mono">{score.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Pontuação</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground font-mono">{level}</p>
                <p className="text-sm text-muted-foreground">Nível</p>
              </div>
            </div>
          </>
        )}

        {type === "gameOver" && (
          <>
            <div className="space-y-2">
              <h2 className="text-5xl md:text-6xl font-bold text-destructive neon-text">GAME OVER</h2>
              <p className="text-muted-foreground text-lg">Sua nave foi destruída!</p>
            </div>

            <div className="bg-card/50 p-6 rounded-xl border border-border space-y-4">
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-4xl font-bold text-accent font-mono">{score.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Pontuação Final</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-secondary font-mono">{level}</p>
                  <p className="text-sm text-muted-foreground">Nível Alcançado</p>
                </div>
              </div>

              {score >= highScore && score > 0 && (
                <div className="flex items-center justify-center gap-2 text-accent animate-pulse">
                  <Trophy className="w-6 h-6" />
                  <span className="font-bold text-lg">NOVO RECORDE!</span>
                  <Trophy className="w-6 h-6" />
                </div>
              )}

              {highScore > 0 && score < highScore && (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Trophy className="w-4 h-4" />
                  <span className="text-sm">Recorde: {highScore.toLocaleString()}</span>
                </div>
              )}
            </div>

            <Button
              size="lg"
              onClick={onStart}
              className="w-full md:w-64 h-14 text-lg font-bold bg-primary hover:bg-primary/80 text-primary-foreground neon-box"
            >
              <Play className="w-6 h-6 mr-2" />
              JOGAR NOVAMENTE
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
