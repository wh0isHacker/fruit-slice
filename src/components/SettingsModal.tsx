import React from 'react';
import { X, Volume2, VolumeX, Music, Wand2, Trash2 } from 'lucide-react';
import { BladeStyle, GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetHighScores: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onResetHighScores,
  onClose,
}) => {
  const bladeOptions: { id: BladeStyle; label: string; color: string }[] = [
    { id: 'cyan', label: 'Katana Cyan', color: '#06b6d4' },
    { id: 'flame', label: 'Solar Flame', color: '#f97316' },
    { id: 'emerald', label: 'Jade Ninja', color: '#10b981' },
    { id: 'violet', label: 'Shadow Violet', color: '#a855f7' },
    { id: 'rainbow', label: 'Rainbow Prism', color: '#ec4899' },
  ];

  return (
    <div
      id="settings-modal-overlay"
      className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-30 select-none animate-in fade-in duration-150 overflow-y-auto"
    >
      <div
        id="settings-modal"
        className="bg-zinc-900/95 border border-white/15 rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
          <h2 id="settings-title" className="text-2xl font-bold font-arcade text-amber-400">
            SETTINGS
          </h2>
          <button
            id="settings-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-5 text-sm">
          {/* Sound Effects */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-arcade text-zinc-200 flex items-center gap-2">
                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
                Sound Effects
              </span>
              <button
                id="toggle-sound-btn"
                onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.soundEnabled ? 'bg-amber-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    settings.soundEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {settings.soundEnabled && (
              <div className="flex items-center gap-3 pl-6">
                <input
                  id="sound-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.soundVolume}
                  onChange={(e) => onUpdateSettings({ soundVolume: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                />
                <span className="text-xs text-zinc-400 w-8 text-right font-mono">
                  {Math.round(settings.soundVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Background Music */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-arcade text-zinc-200 flex items-center gap-2">
                <Music className="w-4 h-4 text-cyan-400" />
                Background Music
              </span>
              <button
                id="toggle-music-btn"
                onClick={() => onUpdateSettings({ musicEnabled: !settings.musicEnabled })}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  settings.musicEnabled ? 'bg-cyan-500' : 'bg-zinc-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform transform ${
                    settings.musicEnabled ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {settings.musicEnabled && (
              <div className="flex items-center gap-3 pl-6">
                <input
                  id="music-volume-slider"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.musicVolume}
                  onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-zinc-700 rounded-lg"
                />
                <span className="text-xs text-zinc-400 w-8 text-right font-mono">
                  {Math.round(settings.musicVolume * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* Blade Trail Style */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <span className="font-arcade text-zinc-200 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400" />
              Blade Trail Aura
            </span>
            <div className="grid grid-cols-2 gap-2">
              {bladeOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => onUpdateSettings({ bladeStyle: opt.id })}
                  className={`px-3 py-2 rounded-xl text-xs font-arcade font-medium flex items-center gap-2 border transition-all cursor-pointer ${
                    settings.bladeStyle === opt.id
                      ? 'bg-white/15 border-white/40 text-white shadow'
                      : 'bg-black/30 border-white/5 text-zinc-400 hover:text-white'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: opt.color, color: opt.color }}
                  />
                  <span className="truncate">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Misses Per Life Rule */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div className="flex flex-col">
              <span className="font-arcade text-zinc-200">Misses per Heart</span>
              <span className="text-[11px] text-zinc-400">Drops allowed before losing 1 life</span>
            </div>
            <select
              value={settings.missesPerLife}
              onChange={(e) => onUpdateSettings({ missesPerLife: parseInt(e.target.value, 10) })}
              className="bg-black/40 border border-white/20 rounded-lg px-2.5 py-1 text-sm font-arcade text-amber-300 cursor-pointer"
            >
              <option value="2">2 Misses</option>
              <option value="3">3 Misses (Classic)</option>
              <option value="4">4 Misses</option>
              <option value="5">5 Misses (Forgiving)</option>
            </select>
          </div>

          {/* Reset High Scores */}
          <div className="pt-2 border-t border-white/10">
            <button
              id="reset-scores-btn"
              onClick={onResetHighScores}
              className="w-full py-2.5 px-3 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/30 text-red-300 font-arcade text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Saved High Scores</span>
            </button>
          </div>
        </div>

        {/* Done Button */}
        <button
          id="settings-done-btn"
          onClick={onClose}
          className="w-full mt-6 py-3 rounded-2xl font-arcade text-base font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 active:scale-95 transition-all cursor-pointer"
        >
          DONE
        </button>
      </div>
    </div>
  );
};
