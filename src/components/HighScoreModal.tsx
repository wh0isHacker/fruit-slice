import React from 'react';
import { X, Trophy, Flame, Timer, Medal } from 'lucide-react';
import { HighScoreRecord } from '../types';

interface HighScoreModalProps {
  highScores: HighScoreRecord;
  onClose: () => void;
}

export const HighScoreModal: React.FC<HighScoreModalProps> = ({ highScores, onClose }) => {
  return (
    <div
      id="highscore-modal-overlay"
      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30 select-none animate-in fade-in duration-150"
    >
      <div
        id="highscore-modal"
        className="bg-zinc-900/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center relative"
      >
        <button
          id="highscore-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3">
          <Trophy className="w-6 h-6 text-amber-400" />
        </div>

        <h2 id="highscore-title" className="text-3xl font-extrabold font-arcade text-amber-400 mb-6">
          HALL OF FAME
        </h2>

        {/* Modes Score Cards */}
        <div className="flex flex-col gap-3 w-full mb-6">
          {/* 1 Minute Timed Mode */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
                <Timer className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-arcade text-sm font-bold text-white">1 Minute Blitz</div>
                <div className="text-xs text-zinc-400 font-sans">Fast 60s Challenge</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-amber-400" />
              <span className="font-arcade text-xl font-extrabold text-amber-300">
                {highScores.timed_1min || 0}
              </span>
            </div>
          </div>

          {/* 2 Minutes Timed Mode */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400">
                <Timer className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-arcade text-sm font-bold text-white">2 Minutes Timed</div>
                <div className="text-xs text-zinc-400 font-sans">Long 120s Endurance</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-cyan-400" />
              <span className="font-arcade text-xl font-extrabold text-cyan-300">
                {highScores.timed_2min || 0}
              </span>
            </div>
          </div>

          {/* Classic Mode Score Card */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400">
                <Flame className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-arcade text-sm font-bold text-white">Classic Mode</div>
                <div className="text-xs text-zinc-400 font-sans">Endless 3 Lives</div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Medal className="w-4 h-4 text-rose-400" />
              <span className="font-arcade text-xl font-extrabold text-rose-300">
                {highScores.classic || 0}
              </span>
            </div>
          </div>
        </div>

        <button
          id="highscore-done-btn"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl font-arcade text-base font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all cursor-pointer"
        >
          BACK
        </button>
      </div>
    </div>
  );
};
