import React from 'react';
import { Trophy, Settings, Timer, Flame, Sparkles } from 'lucide-react';
import { GameMode } from '../types';

interface MainMenuProps {
  selectedMode: GameMode;
  onStartMode: (mode: GameMode) => void;
  onOpenHighScore: () => void;
  onOpenSettings: () => void;
  highScore: number;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  selectedMode,
  onStartMode,
  onOpenHighScore,
  onOpenSettings,
  highScore,
}) => {
  return (
    <div
      id="main-menu"
      className="absolute inset-0 flex flex-col items-center justify-between p-5 sm:p-8 z-20 select-none overflow-y-auto"
    >
      {/* Top Tag & Quick Actions */}
      <div className="w-full flex justify-between items-center max-w-md pt-2">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-arcade">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>ARCADE EDITION</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="menu-high-score-pill"
            onClick={onOpenHighScore}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 border border-amber-400/40 hover:border-amber-400 text-amber-300 hover:text-amber-200 transition-all text-xs sm:text-sm font-arcade shadow-md cursor-pointer"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>BEST: <strong className="text-white font-extrabold">{highScore}</strong></span>
          </button>

          <button
            id="menu-settings-btn"
            onClick={onOpenSettings}
            className="p-2 rounded-full bg-black/50 border border-white/20 hover:border-amber-400 text-zinc-300 hover:text-white transition-all shadow-md cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Title & Mode Selection */}
      <div className="flex flex-col items-center my-auto py-4 max-w-sm w-full text-center">
        {/* Title Logo */}
        <div className="relative mb-4">
          <h1
            id="game-title"
            className="text-5xl sm:text-6xl font-extrabold tracking-tight font-arcade text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-orange-400 to-red-600 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] leading-none"
          >
            FRUIT SLICE
          </h1>
          <div className="text-xs sm:text-sm font-bold text-amber-300/90 tracking-widest uppercase mt-1.5 drop-shadow font-arcade">
            Juicy Blade Action
          </div>
        </div>

        {/* Section Heading */}
        <div className="flex items-center gap-2 mb-3">
          <div className="h-px w-8 bg-amber-400/30" />
          <span className="font-arcade text-xs sm:text-sm font-bold tracking-widest text-amber-300 uppercase">
            CHOOSE TIME
          </span>
          <div className="h-px w-8 bg-amber-400/30" />
        </div>

        {/* Large Touch-Friendly Mode Buttons */}
        <div className="flex flex-col gap-3 w-full">
          {/* 1 MINUTE Option */}
          <button
            id="mode-1min-btn"
            onClick={() => onStartMode('timed_1min')}
            className="w-full p-4 rounded-2xl font-arcade text-left bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent hover:from-amber-500/35 hover:via-orange-500/25 border-2 border-amber-400/50 hover:border-amber-400 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-amber-500/10 cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/30 border border-amber-400/60 flex items-center justify-center text-amber-300 group-hover:scale-110 group-hover:bg-amber-400 group-hover:text-zinc-950 transition-all">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-wide group-hover:text-amber-300 transition-colors">
                  1 MINUTE
                </div>
                <div className="text-xs font-semibold text-amber-300/80 tracking-wide font-sans">
                  Fast Challenge • Blitz Action
                </div>
              </div>
            </div>
            <span className="text-xs font-arcade font-bold px-2.5 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-200">
              60s
            </span>
          </button>

          {/* 2 MINUTES Option */}
          <button
            id="mode-2min-btn"
            onClick={() => onStartMode('timed_2min')}
            className="w-full p-4 rounded-2xl font-arcade text-left bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-transparent hover:from-cyan-500/35 hover:via-blue-500/25 border-2 border-cyan-400/50 hover:border-cyan-400 active:scale-[0.98] transition-all duration-150 shadow-lg shadow-cyan-500/10 cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/30 border border-cyan-400/60 flex items-center justify-center text-cyan-300 group-hover:scale-110 group-hover:bg-cyan-400 group-hover:text-zinc-950 transition-all">
                <Timer className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-white tracking-wide group-hover:text-cyan-300 transition-colors">
                  2 MINUTES
                </div>
                <div className="text-xs font-semibold text-cyan-300/80 tracking-wide font-sans">
                  Long Challenge • Endurance
                </div>
              </div>
            </div>
            <span className="text-xs font-arcade font-bold px-2.5 py-1 rounded-lg bg-cyan-400/20 border border-cyan-400/40 text-cyan-200">
              120s
            </span>
          </button>

          {/* CLASSIC Endless Mode Option */}
          <button
            id="mode-classic-btn"
            onClick={() => onStartMode('classic')}
            className="w-full p-3.5 rounded-2xl font-arcade text-left bg-gradient-to-r from-red-600/15 via-rose-600/10 to-transparent hover:from-red-600/30 hover:via-rose-600/20 border border-red-500/30 hover:border-red-400 active:scale-[0.98] transition-all duration-150 shadow-md cursor-pointer group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/25 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base sm:text-lg font-bold text-zinc-200 group-hover:text-red-300 transition-colors">
                  CLASSIC MODE
                </div>
                <div className="text-[11px] font-medium text-zinc-400 font-sans">
                  3 Lives • Avoid Bombs • Endless
                </div>
              </div>
            </div>
            <span className="text-xs font-arcade font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300">
              3 ❤️
            </span>
          </button>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="text-center text-xs text-amber-200/60 max-w-xs pb-1 font-medium font-sans">
        Tap a mode to begin • Slicing starts the clock!
      </div>
    </div>
  );
};
