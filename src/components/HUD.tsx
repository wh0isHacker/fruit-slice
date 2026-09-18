import React from 'react';
import { Pause, Heart, Clock, Zap } from 'lucide-react';
import { GameMode } from '../types';

interface HUDProps {
  score: number;
  combo?: number;
  lives: number;
  maxLives: number;
  missedFruits: number;
  missesPerLife: number;
  level: number;
  timeRemaining: number;
  gameMode: GameMode;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  combo = 0,
  lives,
  maxLives,
  missedFruits,
  missesPerLife,
  level,
  timeRemaining,
  gameMode,
  onPause,
}) => {
  const isTimedMode = gameMode === 'timed_1min' || gameMode === 'timed_2min';

  // Format MM:SS for countdown timer
  const safeSeconds = Math.max(0, Math.floor(timeRemaining));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const formattedTime = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  const isLowTime = isTimedMode && safeSeconds <= 10 && safeSeconds > 0;
  const isCriticalTime = isTimedMode && safeSeconds <= 5 && safeSeconds > 0;

  const levelNames = ['EASY', 'FASTER', 'MULTI-FRUIT', 'TRICKY ARCS', 'BOMB FRENZY'];
  const currentLevelName = levelNames[Math.min(level - 1, levelNames.length - 1)] || 'INSANE';

  return (
    <div
      id="game-hud"
      className="absolute inset-0 pointer-events-none p-3 sm:p-5 flex flex-col justify-between z-10 select-none"
    >
      {/* Top Header Bar */}
      <div className="flex items-start justify-between w-full">
        {/* Top-Left: SCORE & COMBO */}
        <div id="hud-score-container" className="flex flex-col drop-shadow-md">
          <span className="text-[11px] sm:text-xs font-bold tracking-widest text-amber-400 uppercase font-arcade">
            SCORE
          </span>
          <span
            id="hud-score-value"
            className="text-3xl sm:text-4xl font-black text-white font-arcade tracking-tight leading-none text-shadow-arcade"
          >
            {score}
          </span>

          {/* COMBO under the score */}
          {combo >= 2 && (
            <div
              id="hud-combo-badge"
              className="mt-1 flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/25 border border-amber-400/50 text-amber-300 font-arcade text-xs sm:text-sm font-black animate-pulse shadow-md w-fit"
            >
              <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              <span>COMBO x{combo}</span>
            </div>
          )}
        </div>

        {/* Top-Center: ⏱ MM:SS Countdown Timer */}
        <div id="hud-center-container" className="flex flex-col items-center gap-1">
          {isTimedMode ? (
            <div
              id="hud-timer-badge"
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 rounded-full border shadow-xl backdrop-blur-sm transition-all duration-200 ${
                isCriticalTime
                  ? 'bg-red-600/90 border-red-400 text-white scale-110 shadow-red-600/60 animate-bounce'
                  : isLowTime
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300 scale-105 shadow-rose-900/40 animate-pulse'
                  : 'bg-black/60 border-amber-500/40 text-amber-300'
              }`}
            >
              <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${isCriticalTime ? 'animate-spin' : ''}`} />
              <span className="font-arcade text-xl sm:text-2xl font-black tracking-widest">
                {formattedTime}
              </span>
            </div>
          ) : (
            <div
              id="hud-level-badge"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-emerald-500/30 text-emerald-300 shadow-lg backdrop-blur-xs"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-arcade text-xs sm:text-sm font-bold tracking-wider">
                LVL {level} • {currentLevelName}
              </span>
            </div>
          )}

          {/* Miss indicators in Classic Mode */}
          {gameMode === 'classic' && (
            <div
              id="hud-miss-dots"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 border border-white/10"
              title={`${missedFruits}/${missesPerLife} drops towards losing a heart`}
            >
              <span className="text-[10px] text-zinc-400 font-medium mr-1 font-arcade">DROPS:</span>
              {Array.from({ length: missesPerLife }).map((_, idx) => (
                <span
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    idx < missedFruits
                      ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] scale-110'
                      : 'bg-zinc-700/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Top-Right: Lives (❤️ ❤️ ❤️) & Pause (⏸) */}
        <div id="hud-right-container" className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
          {/* Hearts in Classic Mode */}
          {gameMode === 'classic' && (
            <div
              id="hud-hearts"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-black/40 border border-white/10 shadow-lg"
            >
              {Array.from({ length: maxLives }).map((_, idx) => (
                <Heart
                  key={idx}
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                    idx < lives
                      ? 'text-rose-500 fill-rose-500 drop-shadow-[0_0_6px_rgba(244,63,94,0.7)] scale-100'
                      : 'text-zinc-600 fill-zinc-800 scale-90 opacity-40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Pause Button */}
          <button
            id="hud-pause-btn"
            onClick={onPause}
            aria-label="Pause Game"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold flex items-center justify-center shadow-lg shadow-amber-500/30 border-2 border-amber-300 transition-all cursor-pointer"
          >
            <Pause className="w-5 h-5 fill-zinc-950" />
          </button>
        </div>
      </div>
    </div>
  );
};
