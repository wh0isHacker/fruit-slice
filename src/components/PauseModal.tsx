import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music } from 'lucide-react';
import { GameSettings } from '../types';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  settings: GameSettings;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  settings,
  onToggleSound,
  onToggleMusic,
}) => {
  return (
    <div
      id="pause-modal-overlay"
      className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-30 select-none animate-in fade-in duration-150"
    >
      <div
        id="pause-modal"
        className="bg-zinc-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center"
      >
        <h2
          id="pause-title"
          className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-arcade tracking-wide mb-6"
        >
          GAME PAUSED
        </h2>

        {/* Buttons List */}
        <div className="flex flex-col gap-3 w-full mb-6">
          <button
            id="pause-resume-btn"
            onClick={onResume}
            className="w-full py-3.5 px-6 rounded-2xl font-arcade text-lg font-bold text-zinc-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-zinc-950" />
            <span>RESUME</span>
          </button>

          <button
            id="pause-restart-btn"
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-2xl font-arcade text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span>RESTART</span>
          </button>

          <button
            id="pause-home-btn"
            onClick={onHome}
            className="w-full py-3.5 px-6 rounded-2xl font-arcade text-base font-bold text-zinc-300 bg-white/5 hover:bg-white/15 border border-white/10 active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Home className="w-5 h-5" />
            <span>MAIN MENU</span>
          </button>
        </div>

        {/* Audio Quick Toggles */}
        <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/10 w-full">
          <button
            id="pause-toggle-sfx"
            onClick={onToggleSound}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              settings.soundEnabled
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }`}
            title="Toggle Sound Effects"
          >
            {settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            id="pause-toggle-music"
            onClick={onToggleMusic}
            className={`p-3 rounded-full border transition-all cursor-pointer ${
              settings.musicEnabled
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-zinc-800 border-zinc-700 text-zinc-500'
            }`}
            title="Toggle Music"
          >
            <Music className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
