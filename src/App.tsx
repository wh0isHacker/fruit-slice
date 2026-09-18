import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioManager } from './audio/AudioManager';
import { GameOverModal } from './components/GameOverModal';
import { HighScoreModal } from './components/HighScoreModal';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { GameEngine } from './game/GameEngine';
import { GameMode, GameScreen, GameSettings, GameOverStats, HighScoreRecord } from './types';

const STORAGE_KEYS = {
  SETTINGS: 'fruit_slice_settings_v1',
  HIGHSCORE_TIMED_1MIN: 'fruit_slice_highscore_timed_1min',
  HIGHSCORE_TIMED_2MIN: 'fruit_slice_highscore_timed_2min',
  HIGHSCORE_CLASSIC: 'fruit_slice_highscore_classic',
  SELECTED_MODE: 'fruit_slice_selected_mode',
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // High scores state for all modes
  const [highScores, setHighScores] = useState<HighScoreRecord>(() => ({
    timed_1min: parseInt(localStorage.getItem(STORAGE_KEYS.HIGHSCORE_TIMED_1MIN) || '0', 10),
    timed_2min: parseInt(localStorage.getItem(STORAGE_KEYS.HIGHSCORE_TIMED_2MIN) || '0', 10),
    classic: parseInt(localStorage.getItem(STORAGE_KEYS.HIGHSCORE_CLASSIC) || '0', 10),
  }));

  // Settings state
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore JSON parse errors
    }
    return {
      soundEnabled: true,
      musicEnabled: true,
      soundVolume: 0.8,
      musicVolume: 0.5,
      bladeStyle: 'cyan',
      missesPerLife: 3,
    };
  });

  // Selected game mode
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SELECTED_MODE) as GameMode;
    if (saved === 'timed_1min' || saved === 'timed_2min' || saved === 'classic') {
      return saved;
    }
    return 'timed_1min';
  });

  // Game active states
  const [gameScreen, setGameScreen] = useState<GameScreen>('menu');
  const [score, setScore] = useState<number>(0);
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [missedFruits, setMissedFruits] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [gameOverStats, setGameOverStats] = useState<GameOverStats | null>(null);

  // Modals state
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHighScore, setShowHighScore] = useState<boolean>(false);

  // Sync settings with audio engine and storage
  const handleUpdateSettings = useCallback((newSettings: Partial<GameSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));

      audioManager.updateSettings(
        updated.soundEnabled,
        updated.musicEnabled,
        updated.soundVolume,
        updated.musicVolume
      );

      if (engineRef.current) {
        engineRef.current.bladeTrail.style = updated.bladeStyle;
        engineRef.current.missesPerLife = updated.missesPerLife;
      }

      return updated;
    });
  }, []);

  // Reset high scores
  const handleResetHighScores = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.HIGHSCORE_TIMED_1MIN);
    localStorage.removeItem(STORAGE_KEYS.HIGHSCORE_TIMED_2MIN);
    localStorage.removeItem(STORAGE_KEYS.HIGHSCORE_CLASSIC);
    setHighScores({ timed_1min: 0, timed_2min: 0, classic: 0 });
    audioManager.playButtonClick();
  }, []);

  // Initialize GameEngine
  useEffect(() => {
    if (!canvasRef.current) return;

    audioManager.updateSettings(
      settings.soundEnabled,
      settings.musicEnabled,
      settings.soundVolume,
      settings.musicVolume
    );

    const engine = new GameEngine(canvasRef.current, {
      onScoreChange: (newScore) => setScore(newScore),
      onLivesChange: (newLives) => setLives(newLives),
      onMissesChange: (newMisses) => setMissedFruits(newMisses),
      onLevelChange: (newLevel) => setLevel(newLevel),
      onTimeChange: (newTime) => setTimeRemaining(newTime),
      onGameOver: (stats) => {
        setGameOverStats(stats);
        setGameScreen('gameover');
        if (stats.isNewHighScore) {
          setHighScores((prev) => ({
            ...prev,
            [stats.gameMode]: stats.score,
          }));
        }
      },
      onCombo: (combo) => {
        setCurrentCombo(combo);
        // Clear combo indicator after 1.4 seconds if inactive
        setTimeout(() => {
          setCurrentCombo((prev) => (prev === combo ? 0 : prev));
        }, 1400);
      },
    });

    engine.bladeTrail.style = settings.bladeStyle;
    engine.missesPerLife = settings.missesPerLife;
    engine.startLoop();
    engineRef.current = engine;

    const handleResize = () => {
      engine.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      engine.stopLoop();
    };
  }, []); // Run once on mount

  // Sync blade style and missesPerLife if engine exists
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.bladeTrail.style = settings.bladeStyle;
      engineRef.current.missesPerLife = settings.missesPerLife;
    }
  }, [settings.bladeStyle, settings.missesPerLife]);

  // Handlers for game lifecycle: Start directly on mode select without a play button
  const handleStartMode = (mode: GameMode) => {
    setGameMode(mode);
    localStorage.setItem(STORAGE_KEYS.SELECTED_MODE, mode);
    audioManager.resume();
    audioManager.playButtonClick();

    if (engineRef.current) {
      setScore(0);
      setCurrentCombo(0);
      setLives(3);
      setMissedFruits(0);
      setLevel(1);
      const initialTime = mode === 'timed_2min' ? 120 : 60;
      setTimeRemaining(initialTime);
      setGameOverStats(null);
      setGameScreen('playing');
      engineRef.current.startGame(mode);
    }
  };

  const handlePause = () => {
    audioManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.pauseGame();
      setGameScreen('paused');
    }
  };

  const handleResume = () => {
    audioManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.resumeGame();
      setGameScreen('playing');
    }
  };

  const handleRestart = () => {
    audioManager.playButtonClick();
    if (engineRef.current) {
      setScore(0);
      setCurrentCombo(0);
      setLives(3);
      setMissedFruits(0);
      setLevel(1);
      const initialTime = gameMode === 'timed_2min' ? 120 : 60;
      setTimeRemaining(initialTime);
      setGameOverStats(null);
      setGameScreen('playing');
      engineRef.current.startGame(gameMode);
    }
  };

  const handleHome = () => {
    audioManager.playButtonClick();
    if (engineRef.current) {
      engineRef.current.goToMenu();
      setGameScreen('menu');
      setGameOverStats(null);
    }
  };

  const currentBestScore =
    gameMode === 'timed_1min'
      ? highScores.timed_1min
      : gameMode === 'timed_2min'
      ? highScores.timed_2min
      : highScores.classic;

  return (
    <main
      id="fruit-slice-game-container"
      className="relative w-screen h-screen overflow-hidden bg-[#12101e] select-none touch-none"
    >
      {/* 1. Fullscreen HTML5 Game Canvas */}
      <canvas
        id="game-canvas"
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-crosshair"
      />

      {/* 2. In-Game Heads Up Display */}
      {gameScreen === 'playing' && (
        <HUD
          score={score}
          combo={currentCombo}
          lives={lives}
          maxLives={3}
          missedFruits={missedFruits}
          missesPerLife={settings.missesPerLife}
          level={level}
          timeRemaining={timeRemaining}
          gameMode={gameMode}
          onPause={handlePause}
        />
      )}

      {/* 3. Main Menu (Direct touch-friendly mode selection without play button) */}
      {gameScreen === 'menu' && !showSettings && !showHighScore && (
        <MainMenu
          selectedMode={gameMode}
          onStartMode={handleStartMode}
          onOpenHighScore={() => {
            audioManager.playButtonClick();
            setShowHighScore(true);
          }}
          onOpenSettings={() => {
            audioManager.playButtonClick();
            setShowSettings(true);
          }}
          highScore={currentBestScore}
        />
      )}

      {/* 4. Pause Screen Modal */}
      {gameScreen === 'paused' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onHome={handleHome}
          settings={settings}
          onToggleSound={() => {
            handleUpdateSettings({ soundEnabled: !settings.soundEnabled });
          }}
          onToggleMusic={() => {
            handleUpdateSettings({ musicEnabled: !settings.musicEnabled });
          }}
        />
      )}

      {/* 5. Game Over Modal */}
      {gameScreen === 'gameover' && gameOverStats && (
        <GameOverModal
          stats={gameOverStats}
          onPlayAgain={handleRestart}
          onHome={handleHome}
        />
      )}

      {/* 6. Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onResetHighScores={handleResetHighScores}
          onClose={() => {
            audioManager.playButtonClick();
            setShowSettings(false);
          }}
        />
      )}

      {/* 7. High Scores Modal */}
      {showHighScore && (
        <HighScoreModal
          highScores={highScores}
          onClose={() => {
            audioManager.playButtonClick();
            setShowHighScore(false);
          }}
        />
      )}
    </main>
  );
}
