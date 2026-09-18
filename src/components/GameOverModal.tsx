import React from 'react';
import { RotateCcw, Home, Trophy, Sparkles, Flame, Apple, Zap } from 'lucide-react';
import { GameOverStats } from '../types';

interface GameOverModalProps {
  stats: GameOverStats;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onPlayAgain,
  onHome,
}) => {
  const {
    score,
    bestScore,
    fruitsSliced,
    maxCombo,
    isNewHighScore,
    isTimesUp,
    gameMode,
  } = stats;

  const modeTitle =
    gameMode === 'timed_1min'
      ? '1 MINUTE TIMED'
      : gameMode === 'timed_2min'
      ? '2 MINUTES TIMED'
      : 'CLASSIC MODE';

  return (
    <div
      id="gameover-modal-overlay"
      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30 select-none animate-in fade-in duration-200"
    >
      <div
        id="gameover-modal"
        className="bg-zinc-900/95 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
      >
        {/* New High Score Celebratory Banner */}
        {isNewHighScore && (
          <div
            id="new-high-score-banner"
            className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-zinc-950 font-arcade text-xs sm:text-sm font-black tracking-wider py-1.5 px-4 mb-4 rounded-xl flex items-center justify-center gap-1.5 shadow-lg animate-bounce"
          >
            <Sparkles className="w-4 h-4 fill-zinc-950" />
            <span>NEW HIGH SCORE!</span>
            <Sparkles className="w-4 h-4 fill-zinc-950" />
          </div>
        )}

        {/* Title */}
        <h2
          id="gameover-title"
          className={`text-4xl sm:text-5xl font-black font-arcade tracking-tight drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] mb-1 ${
            isTimesUp ? 'text-amber-400' : 'text-rose-500'
          }`}
        >
          {isTimesUp ? "TIME'S UP!" : 'GAME OVER'}
        </h2>

        <div className="text-[11px] sm:text-xs font-bold text-zinc-400 tracking-widest uppercase mb-5 font-arcade">
          {modeTitle}
        </div>

        {/* Complete Stats Display Box */}
        <div className="w-full bg-black/45 border border-white/10 rounded-2xl p-4 mb-6 flex flex-col gap-2.5">
          {/* Final Score */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs sm:text-sm font-arcade text-zinc-400">FINAL SCORE:</span>
            <span
              id="gameover-final-score"
              className="text-2xl sm:text-3xl font-black text-white font-arcade text-shadow-arcade"
            >
              {score}
            </span>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Best Score */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs sm:text-sm font-arcade text-amber-400 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              BEST SCORE:
            </span>
            <span
              id="gameover-best-score"
              className="text-lg sm:text-xl font-bold text-amber-300 font-arcade"
            >
              {bestScore}
            </span>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Fruits Sliced */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs sm:text-sm font-arcade text-emerald-400 flex items-center gap-1.5">
              <Apple className="w-3.5 h-3.5 text-emerald-400" />
              FRUITS SLICED:
            </span>
            <span
              id="gameover-fruits-sliced"
              className="text-lg sm:text-xl font-bold text-emerald-300 font-arcade"
            >
              {fruitsSliced}
            </span>
          </div>

          <div className="w-full h-px bg-white/10" />

          {/* Max Combo */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs sm:text-sm font-arcade text-yellow-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              MAX COMBO:
            </span>
            <span
              id="gameover-max-combo"
              className="text-lg sm:text-xl font-bold text-yellow-300 font-arcade"
            >
              x{maxCombo}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full">
          <button
            id="gameover-replay-btn"
            onClick={onPlayAgain}
            className="w-full py-4 px-6 rounded-2xl font-arcade text-base sm:text-lg font-black text-zinc-950 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:from-amber-300 hover:to-orange-300 active:scale-95 transition-all shadow-xl shadow-amber-500/20 border border-amber-200 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5 stroke-[2.5]" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            id="gameover-home-btn"
            onClick={onHome}
            className="w-full py-3.5 px-6 rounded-2xl font-arcade text-sm sm:text-base font-bold text-zinc-300 bg-white/10 hover:bg-white/20 border border-white/15 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
};
