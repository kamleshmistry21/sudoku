import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Undo2, 
  Redo2, 
  PlusCircle, 
  Trophy, 
  HelpCircle, 
  Lightbulb, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Clock, 
  Flame, 
  AlertTriangle,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

import { Difficulty, Board, GameStatus, Move, GameStats, Cell } from './types';
import { createGameBoard, isGameSolved, getHint, HintDetail } from './utils/sudoku';
import HowToPlayModal from './components/HowToPlayModal';
import StatsModal from './components/StatsModal';
import SudokuGrid from './components/SudokuGrid';
import Keyboard from './components/Keyboard';

const INITIAL_STATS: GameStats = {
  gamesPlayed: { easy: 0, medium: 0, hard: 0, expert: 0 },
  gamesWon: { easy: 0, medium: 0, hard: 0, expert: 0 },
  bestTime: { easy: null, medium: null, hard: null, expert: null },
  currentStreak: { easy: 0, medium: 0, hard: 0, expert: 0 },
};

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; border: string; bg: string }> = {
  easy: { label: 'Easy', color: 'text-emerald-800 bg-emerald-50 border-emerald-100', border: 'border-emerald-600', bg: 'bg-emerald-600' },
  medium: { label: 'Medium', color: 'text-amber-800 bg-amber-50/60 border-amber-100', border: 'border-amber-600', bg: 'bg-amber-600' },
  hard: { label: 'Hard', color: 'text-rose-800 bg-rose-50 border-rose-100', border: 'border-rose-600', bg: 'bg-rose-600' },
  expert: { label: 'Expert', color: 'text-indigo-800 bg-indigo-50 border-indigo-100', border: 'border-indigo-600', bg: 'bg-indigo-600' },
};

export default function App() {
  // Game Configuration State
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [gridSize, setGridSize] = useState<9 | 12>(9);
  const [board, setBoard] = useState<Board>([]);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [timer, setTimer] = useState<number>(0);
  const [movesCount, setMovesCount] = useState<number>(0);
  const [isPencilMode, setIsPencilMode] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<number>(0);
  const [strictMistakes, setStrictMistakes] = useState<boolean>(true); // limit to 3 strikes

  // Toggles
  const [showConflicts, setShowConflicts] = useState<boolean>(true);
  const [highlightIdentical, setHighlightIdentical] = useState<boolean>(true);

  // Undo/Redo stacks
  const [history, setHistory] = useState<Move[]>([]);
  const [redoStack, setRedoStack] = useState<Move[]>([]);

  // Modals
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);

  // Hints
  const [hintDetail, setHintDetail] = useState<HintDetail | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Statistics
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);

  // Celebration state
  const [isFirstWon, setIsFirstWon] = useState<boolean>(false);
  const [reviewMode, setReviewMode] = useState<boolean>(false);

  // Refs for tracking timer details
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial configuration load (Stats and previous game if any)
  useEffect(() => {
    // Load statistics
    const savedStats = localStorage.getItem('sudoku_achievements');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('Error parsing stats, resetting', e);
      }
    }

    // Load active puzzle if any
    const activePuzzle = localStorage.getItem('sudoku_active_game');
    if (activePuzzle) {
      try {
        const decoded = JSON.parse(activePuzzle);
        const sz = decoded.gridSize || 9;
        setGridSize(sz);
        setBoard(decoded.board);
        setDifficulty(decoded.difficulty);
        setTimer(decoded.timer);
        setMovesCount(decoded.movesCount || 0);
        setMistakes(decoded.mistakes || 0);
        setGameStatus(decoded.gameStatus);
        setHistory(decoded.history || []);
        setRedoStack(decoded.redoStack || []);
        setIsPencilMode(decoded.isPencilMode || false);
      } catch (e) {
        console.error('Failed to load active puzzle, generating fresh', e);
        setGameStatus('idle');
      }
    } else {
      // Start on Startup screen
      setGameStatus('idle');
    }
  }, []);

  // 2. Auto-save puzzle progress on state changes
  useEffect(() => {
    if (gameStatus === 'playing' || gameStatus === 'paused') {
      const stateToSave = {
        board,
        gridSize,
        difficulty,
        timer,
        movesCount,
        mistakes,
        gameStatus,
        history,
        redoStack,
        isPencilMode,
      };
      localStorage.setItem('sudoku_active_game', JSON.stringify(stateToSave));
    } else if (gameStatus === 'completed' || gameStatus === 'failed') {
      localStorage.removeItem('sudoku_active_game');
    }
  }, [board, gridSize, difficulty, timer, movesCount, mistakes, gameStatus, history, redoStack, isPencilMode]);

  // 3. Timer engine
  useEffect(() => {
    if (gameStatus === 'playing') {
      timerIntervalRef.current = setInterval(() => {
        setTimer((v) => v + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [gameStatus]);

  // Toast timer auto-clear
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => {
        setToastMessage(null);
      }, 5500);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  // 4. Game Setup Logic
  const startNewGame = (diff: Difficulty = difficulty, sz: 9 | 12 = gridSize) => {
    setDifficulty(diff);
    setGridSize(sz);
    const freshBoard = createGameBoard(diff, sz);
    setBoard(freshBoard);
    setSelectedCell(null);
    setTimer(0);
    setMovesCount(0);
    setMistakes(0);
    setHistory([]);
    setRedoStack([]);
    setIsPencilMode(false);
    setHintDetail(null);
    setToastMessage(null);
    setIsFirstWon(false);
    setReviewMode(false);

    // Update stats for matches played
    setStats((prev) => {
      const updated = {
        ...prev,
        gamesPlayed: {
          ...prev.gamesPlayed,
          [diff]: prev.gamesPlayed[diff] + 1,
        },
      };
      localStorage.setItem('sudoku_achievements', JSON.stringify(updated));
      return updated;
    });

    setGameStatus('playing');
  };

  // 5. Reset puzzle keeping same grid
  const restartCurrentPuzzle = () => {
    if (!confirm('Are you sure you want to clear your progress and restart this exact puzzle?')) return;
    
    setBoard((prev) => {
      return prev.map((row) =>
        row.map((cell) => {
          if (cell.isGiven) return cell;
          return {
            ...cell,
            value: 0,
            pencilMarks: [],
          };
        })
      );
    });
    setSelectedCell(null);
    setTimer(0);
    setMovesCount(0);
    setMistakes(0);
    setHistory([]);
    setRedoStack([]);
    setIsPencilMode(false);
    setHintDetail(null);
    setToastMessage(null);
    setGameStatus('playing');
  };

  // 6. Statistics reset
  const handleResetStats = () => {
    localStorage.setItem('sudoku_achievements', JSON.stringify(INITIAL_STATS));
    setStats(INITIAL_STATS);
    setToastMessage('Statistics have been reset successfully.');
  };

  // 7. Inputs implementation: Number, Erase, Hints
  const handleNumberInput = (num: number) => {
    if (!selectedCell || gameStatus !== 'playing') return;
    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isGiven) return;

    // Track a valid move input attempts
    setMovesCount(m => m + 1);

    if (isPencilMode) {
      // Create clone of board to mutate
      const updatedBoard = board.map(r => r.map(c => ({ ...c, pencilMarks: [...c.pencilMarks] })));
      const pencilCell = updatedBoard[row][col];

      // Clear main value when writing notes
      pencilCell.value = 0;

      const oldPencil = [...pencilCell.pencilMarks];
      let newPencil: number[];

      if (pencilCell.pencilMarks.includes(num)) {
        newPencil = pencilCell.pencilMarks.filter(val => val !== num);
      } else {
        newPencil = [...pencilCell.pencilMarks, num].sort((a, b) => a - b);
      }
      pencilCell.pencilMarks = newPencil;

      // Log Move in Undo History
      const move: Move = {
        row,
        col,
        type: 'pencil',
        oldValue: cell.value,
        newValue: 0,
        oldPencil,
        newPencil,
      };

      setHistory(prev => [...prev, move]);
      setRedoStack([]); // Clear redo
      setBoard(updatedBoard);
    } else {
      // Normal digit input
      if (cell.value === num) return; // already identical, skip

      const updatedBoard = board.map(r => r.map(c => ({ ...c, pencilMarks: [...c.pencilMarks] })));
      const targetCell = updatedBoard[row][col];

      const oldVal = targetCell.value;
      const oldPencilValues = [...targetCell.pencilMarks];

      targetCell.value = num;
      targetCell.pencilMarks = []; // Clear pencil marks on value input

      // Automatically eliminate this candidate number from all other cell notes in the same group!
      // Row elimination
      for (let c = 0; c < gridSize; c++) {
        if (c !== col && updatedBoard[row][c].pencilMarks.includes(num)) {
          updatedBoard[row][c].pencilMarks = updatedBoard[row][c].pencilMarks.filter(x => x !== num);
        }
      }
      // Column elimination
      for (let r = 0; r < gridSize; r++) {
        if (r !== row && updatedBoard[r][col].pencilMarks.includes(num)) {
          updatedBoard[r][col].pencilMarks = updatedBoard[r][col].pencilMarks.filter(x => x !== num);
        }
      }
      // block elimination
      const blockRows = 3;
      const blockCols = gridSize === 12 ? 4 : 3;
      const sRow = row - (row % blockRows);
      const sCol = col - (col % blockCols);
      for (let r = sRow; r < sRow + blockRows; r++) {
        for (let c = sCol; c < sCol + blockCols; c++) {
          if ((r !== row || c !== col) && updatedBoard[r]?.[c] && updatedBoard[r][c].pencilMarks.includes(num)) {
            updatedBoard[r][c].pencilMarks = updatedBoard[r][c].pencilMarks.filter(x => x !== num);
          }
        }
      }

      // Check if input results in failure under strict mistakes limit
      let nextMistakes = mistakes;
      if (num !== targetCell.solution) {
        nextMistakes += 1;
        setMistakes(nextMistakes);

        if (strictMistakes && nextMistakes >= 3) {
          setGameStatus('failed');
          triggerStreakBreak(difficulty);
        }
      }

      const move: Move = {
        row,
        col,
        type: 'value',
        oldValue: oldVal,
        newValue: num,
        oldPencil: oldPencilValues,
        newPencil: [],
      };

      setHistory(prev => [...prev, move]);
      setRedoStack([]);
      setBoard(updatedBoard);

      // Check Completion after setting
      checkCompletion(updatedBoard);
    }
  };

  const handleEraseClick = () => {
    if (!selectedCell || gameStatus !== 'playing') return;
    const { row, col } = selectedCell;
    const cell = board[row][col];

    if (cell.isGiven || (cell.value === 0 && cell.pencilMarks.length === 0)) return;

    const updatedBoard = board.map(r => r.map(c => ({ ...c, pencilMarks: [...c.pencilMarks] })));
    const targetCell = updatedBoard[row][col];

    const oldVal = targetCell.value;
    const oldPencil = [...targetCell.pencilMarks];

    targetCell.value = 0;
    targetCell.pencilMarks = [];

    const move: Move = {
      row,
      col,
      type: 'value',
      oldValue: oldVal,
      newValue: 0,
      oldPencil,
      newPencil: [],
    };

    setHistory(prev => [...prev, move]);
    setRedoStack([]);
    setBoard(updatedBoard);
  };

  const handleHintClick = () => {
    if (gameStatus !== 'playing') return;

    // Call helper to analyze board and extract optimal hint
    const h = getHint(board, selectedCell?.row ?? null, selectedCell?.col ?? null);

    if (h) {
      setHintDetail(h);
      setToastMessage(h.message);

      // Mutate grid automatically to place correct value
      const updatedBoard = board.map(r => r.map(c => ({ ...c, pencilMarks: [...c.pencilMarks] })));
      const cell = updatedBoard[h.row][h.col];
      
      const oldVal = cell.value;
      const oldPencil = [...cell.pencilMarks];

      cell.value = h.value;
      cell.pencilMarks = [];

      const move: Move = {
        row: h.row,
        col: h.col,
        type: 'value',
        oldValue: oldVal,
        newValue: h.value,
        oldPencil,
        newPencil: [],
      };

      setHistory(prev => [...prev, move]);
      setRedoStack([]);
      setBoard(updatedBoard);
      
      // Auto-select row col where hint was given to help player identify it
      setSelectedCell({ row: h.row, col: h.col });

      checkCompletion(updatedBoard);
    } else {
      setToastMessage("Excellent work! No mistakes found on the board, keep completing the remaining slots.");
    }
  };

  // Undo / Redo core mechanics
  const handleUndo = () => {
    if (history.length === 0 || gameStatus !== 'playing') return;

    const move = history[history.length - 1];
    const updatedBoard = board.map(r => r.map(c => ({ ...c, pencilMarks: [...c.pencilMarks] })));
    const cell = updatedBoard[move.row][move.col];

    if (move.type === 'value') {
      cell.value = move.oldValue || 0;
      cell.pencilMarks = move.oldPencil || [];
    } else {
      cell.value = move.oldValue || 0;
      cell.pencilMarks = move.oldPencil || [];
    }

    setHistory(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, move]);
    setBoard(updatedBoard);
    setSelectedCell({ row: move.row, col: move.col });
  };

  const handleRedo = () => {
    if (redoStack.length === 0 || gameStatus !== 'playing') return;

    const move = redoStack[redoStack.length - 1];
    const updatedBoard = board.map(r => r.map(c => ({ ...c, pencilMarks: [...c.pencilMarks] })));
    const cell = updatedBoard[move.row][move.col];

    if (move.type === 'value') {
      cell.value = move.newValue || 0;
      cell.pencilMarks = move.newPencil || [];
    } else {
      cell.value = move.newValue || 0;
      cell.pencilMarks = move.newPencil || [];
    }

    setRedoStack(prev => prev.slice(0, -1));
    setHistory(prev => [...prev, move]);
    setBoard(updatedBoard);
    setSelectedCell({ row: move.row, col: move.col });
  };

  // 8. Grid Event bindings
  const handleCellSelect = (r: number, c: number) => {
    if (gameStatus === 'playing') {
      setSelectedCell({ row: r, col: c });
    }
  };

  const handleArrowNavigation = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!selectedCell) return;
    let { row, col } = selectedCell;

    if (direction === 'up' && row > 0) row--;
    else if (direction === 'down' && row < gridSize - 1) row++;
    else if (direction === 'left' && col > 0) col--;
    else if (direction === 'right' && col < gridSize - 1) col++;

    setSelectedCell({ row, col });
  };

  // Clear notes of currently selected cell
  const handleClearNotesOnly = () => {
    if (!selectedCell || gameStatus !== 'playing') return;
    const { row, col } = selectedCell;
    const cell = board[row][col];
    if (cell.isGiven || cell.pencilMarks.length === 0) return;

    const updatedBoard = board.map(r => r.map(c => ({ ...c, pencilMarks: [...c.pencilMarks] })));
    const targetCell = updatedBoard[row][col];
    const oldPencil = [...targetCell.pencilMarks];

    targetCell.pencilMarks = [];

    const move: Move = {
      row,
      col,
      type: 'pencil',
      oldValue: targetCell.value,
      newValue: targetCell.value,
      oldPencil,
      newPencil: [],
    };

    setHistory(prev => [...prev, move]);
    setRedoStack([]);
    setBoard(updatedBoard);
  };

  // Complete solver helper
  const checkCompletion = (currentBoard: Board) => {
    if (isGameSolved(currentBoard)) {
      setGameStatus('completed');
      setIsFirstWon(true);
      setSelectedCell(null);
      triggerStreakWin(difficulty);
    }
  };

  // Streak logic on wins
  const triggerStreakWin = (diff: Difficulty) => {
    setStats((prev) => {
      const nextStreak = prev.currentStreak[diff] + 1;
      const prevBest = prev.bestTime[diff];
      const currentBest = prevBest === null ? timer : Math.min(prevBest, timer);

      const updated = {
        ...prev,
        gamesWon: {
          ...prev.gamesWon,
          [diff]: prev.gamesWon[diff] + 1,
        },
        currentStreak: {
          ...prev.currentStreak,
          [diff]: nextStreak,
        },
        bestTime: {
          ...prev.bestTime,
          [diff]: currentBest,
        },
      };

      localStorage.setItem('sudoku_achievements', JSON.stringify(updated));
      return updated;
    });
  };

  // Streak logic on failure
  const triggerStreakBreak = (diff: Difficulty) => {
    setStats((prev) => {
      const updated = {
        ...prev,
        currentStreak: {
          ...prev.currentStreak,
          [diff]: 0,
        },
      };
      localStorage.setItem('sudoku_achievements', JSON.stringify(updated));
      return updated;
    });
  };

  // Let failures bypass the mistakes limit to continue the game
  const handleContinueAfterFailure = () => {
    setMistakes(0);
    setGameStatus('playing');
    setToastMessage('Game resumed! Strike count has been cleared so you can complete this Sudoku.');
  };

  // Compute number counts currently correctly placed on the board to grey out keypad numbers
  const getNumberCounts = (): Record<number, number> => {
    const counts: Record<number, number> = {};
    for (let i = 1; i <= gridSize; i++) {
      counts[i] = 0;
    }
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const val = board[r]?.[c]?.value;
        if (val && val > 0 && val === board[r][c].solution) {
          counts[val]++;
        }
      }
    }
    return counts;
  };

  const numberCounts = getNumberCounts();

  // Format timer
  const formatTimerValue = (seconds: number): string => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div id="sudoku-app-container" className="min-h-screen bg-[#F8F5F2] select-none pb-12">
      {/* Dynamic Header */}
      <nav className="sticky top-0 bg-white/95 border-b border-[#D4D9BA] backdrop-blur-md z-45 px-4 py-3 sm:py-3.5 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5A5A40] text-white shadow-md">
              <span className="font-serif font-black text-lg select-none">S</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-serif font-bold text-[#2D2D2A] flex items-center gap-1.5 leading-none">
                Sudoku <span className="hidden sm:inline-block text-[10px] bg-[#D4D9BA]/50 text-[#5A5A40] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">Premium</span>
              </h1>
              <p className="hidden sm:block text-[10px] text-[#8A8A70] font-semibold mt-0.5">Clean organic zen puzzles</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-2">
            {gameStatus !== 'idle' && (
              <button
                onClick={() => {
                  setGameStatus('idle');
                  setReviewMode(false);
                }}
                className="mr-0.5 flex h-8 sm:h-9 px-2.5 sm:px-3 items-center justify-center rounded-xl border border-dashed border-[#D4D9BA] bg-white hover:bg-[#FDFCF0]/60 text-[#5A5A40] text-xs font-bold transition-all cursor-pointer shrink-0"
                title="Return to configuration main screen"
              >
                <span className="hidden sm:inline">Quit Board</span>
                <span className="sm:hidden">Quit</span>
              </button>
            )}
            <button
              onClick={() => setIsHowToPlayOpen(true)}
              className="flex h-8 sm:h-9 p-2 sm:p-2.5 items-center justify-center rounded-xl border border-[#D4D9BA] bg-white hover:bg-[#FDFCF0]/60 text-[#5A5A40] transition-all cursor-pointer shrink-0"
              title="How to Play"
            >
              <HelpCircle className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
            </button>
            <button
              onClick={() => setIsStatsOpen(true)}
              className="flex h-8 sm:h-9 p-2 sm:p-2.5 items-center justify-center rounded-xl border border-[#D4D9BA] bg-white hover:bg-[#FDFCF0]/60 text-[#5A5A40] transition-all cursor-pointer shrink-0"
              title="Stats & Achievements"
            >
              <Trophy className="h-4 sm:h-4.5 w-4 sm:w-4.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container Grid */}
      <main className="max-w-xl mx-auto px-4 pt-5 space-y-4">
        
        {/* VIEW 1: STARTUP SCREEN */}
        {gameStatus === 'idle' && (
          <div className="rounded-2xl bg-white border border-[#D4D9BA]/70 p-5 sm:p-7 shadow-xs space-y-6">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5A5A40] text-white shadow-md font-serif font-black text-2xl">
                S
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-black text-[#2D2D2A]">Zen Sudoku Launcher</h2>
              <p className="text-xs text-[#8A8A70] font-medium max-w-sm mx-auto leading-relaxed">
                Choose your puzzle configuration, grid dimension format, and helpful assistance features to begin.
              </p>
            </div>

            {/* Grid Size Selection */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8A70] block">1. Select Grid Format</span>
              <div className="grid grid-cols-2 gap-3 bg-[#E8E6D1]/10 p-1.5 rounded-xl border border-[#D4D9BA]/50">
                {([9, 12] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setGridSize(sz)}
                    className={`py-3 px-2 text-xs font-bold rounded-lg cursor-pointer transition-all flex flex-col items-center justify-center gap-0.5 ${
                      gridSize === sz
                        ? 'bg-[#5A5A40] text-white shadow-xs scale-102 font-black'
                        : 'text-[#8A8A70] hover:text-[#5A5A40] hover:bg-[#E8E6D1]/20'
                    }`}
                  >
                    <span className="text-sm font-serif">{sz} x {sz}</span>
                    <span className="text-[9px] opacity-75 font-normal">
                      {sz === 9 ? 'Standard (0-9, A-B)' : 'Epic (0-9, A-B)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Level Selection */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8A8A70] block">2. Choose Difficulty</span>
              <div className="grid grid-cols-4 gap-2">
                {(['easy', 'medium', 'hard', 'expert'] as Difficulty[]).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`
                      py-3 text-xs font-black rounded-xl border capitalize transition-all text-center cursor-pointer
                      ${
                        difficulty === diff
                          ? 'bg-[#5A5A40] text-white border-[#5A5A40] shadow-sm transform scale-105'
                          : 'border-[#D4D9BA] text-[#8A8A70] bg-white hover:bg-[#FDFCF0] hover:text-[#5A5A40]'
                      }
                    `}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Assistance Toggles */}
            <div className="bg-stone-50/70 rounded-2xl border border-[#D4D9BA]/50 p-4 space-y-3.5 text-xs sm:text-sm font-semibold select-none">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-[#8A8A70] mb-1 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-[#5A5A40]" />
                3. Configure Rules & Assistants
              </h4>

              {/* Strict Mistakes (Strikes) Toggles */}
              <div className="flex items-center justify-between border-b border-[#D4D9BA]/30 pb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[#2D2D2A] font-bold block">Strict Strikes Mode</span>
                  <p className="text-[10px] text-[#8A8A70]">Limit game to 3 mistakes maximum</p>
                </div>
                <button
                  onClick={() => setStrictMistakes(!strictMistakes)}
                  className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                    strictMistakes ? 'bg-[#5A5A40]' : 'bg-[#D4D9BA]/50'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      strictMistakes ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Highlight Identical Values */}
              <div className="flex items-center justify-between border-b border-[#D4D9BA]/35 pb-2.5">
                <div className="space-y-0.5">
                  <span className="text-[#2D2D2A] font-bold block">Highlight Identical Values</span>
                  <p className="text-[10px] text-[#8A8A70]">Highlights cells with matching numbers currently on board</p>
                </div>
                <button
                  onClick={() => setHighlightIdentical(!highlightIdentical)}
                  className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                    highlightIdentical ? 'bg-[#5A5A40]' : 'bg-[#D4D9BA]/50'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      highlightIdentical ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Auto-highlight conflicts */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-[#2D2D2A] font-bold block">Auto-highlight Conflicts</span>
                  <p className="text-[10px] text-[#8A8A70]">Real-time detection of duplicate values in same group</p>
                </div>
                <button
                  onClick={() => setShowConflicts(!showConflicts)}
                  className={`flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                    showConflicts ? 'bg-[#5A5A40]' : 'bg-[#D4D9BA]/50'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                      showConflicts ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Launchers footer */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={() => startNewGame(difficulty, gridSize)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A32] active:scale-95 text-white font-extrabold text-sm transition-all border border-[#5A5A40] cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-serif"
              >
                Create New Board ({gridSize}x{gridSize} {difficulty.toUpperCase()})
              </button>

              {board && board.length > 0 && (
                <button
                  onClick={() => {
                    setGameStatus('playing');
                    setReviewMode(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-white text-[#5A5A40] hover:bg-[#FDFCF0]/80 border border-[#D4D9BA] text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Resume Saved Game ({board.length}x{board.length})
                </button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE RUNNING GAME SCREEN */}
        {((gameStatus === 'playing' || gameStatus === 'paused') || (reviewMode && (gameStatus === 'completed' || gameStatus === 'failed'))) && (
          <>
            {/* Banner if reviewing finalized board */}
            {reviewMode && (
              <div className="rounded-2xl bg-[#5A5A40] text-stone-100 p-3 shadow-xs flex items-center justify-between text-xs font-bold leading-normal">
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-[#D4D9BA]" />
                  Reviewing Board (Non-editable Mode)
                </span>
                <button
                  onClick={() => setReviewMode(false)}
                  className="px-3 py-1 bg-white hover:bg-stone-100 text-[#5A5A40] rounded-xl text-[10px] font-black uppercase transition shadow-xs cursor-pointer"
                >
                  Return to Results
                </button>
              </div>
            )}

            {/* Focused Running Game Stat Bar: Timer, Moves, Strikes, Undo/Redo/Reset */}
            <div className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-white border border-[#D4D9BA]/70 p-2 sm:p-3.5 shadow-xs text-xs sm:text-sm font-semibold select-none">
              <div className="flex items-center gap-1.5 sm:gap-4 overflow-hidden">
                {/* Timer Control */}
                <div className="flex items-center gap-1 shrink-0">
                  <Clock className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-[#8A8A70] shrink-0" />
                  <span className="font-mono text-[#2D2D2A] tabular-nums w-10 sm:w-12 text-center text-xs sm:text-sm">{formatTimerValue(timer)}</span>
                  {!reviewMode && (
                    <button
                      id="btn-pause-toggle"
                      onClick={() => {
                        if (gameStatus === 'playing') setGameStatus('paused');
                        else if (gameStatus === 'paused') setGameStatus('playing');
                      }}
                      disabled={gameStatus !== 'playing' && gameStatus !== 'paused'}
                      className="flex items-center justify-center p-0.5 sm:p-1 hover:bg-[#E8E6D1]/40 rounded-lg text-[#5A5A40] cursor-pointer disabled:opacity-30 disabled:pointer-events-none transition-colors shrink-0"
                      title={gameStatus === 'paused' ? 'Resume' : 'Pause'}
                    >
                      {gameStatus === 'paused' ? <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
                    </button>
                  )}
                </div>

                {/* Moves count */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[#8A8A70] hidden xs:inline">Moves:</span>
                  <span className="text-[#8A8A70] xs:hidden">M:</span>
                  <span className="font-mono font-black text-[#5A5A40] bg-[#E8E6D1]/25 px-1.5 sm:px-2 py-0.5 rounded border border-[#D4D9BA]/35 tabular-nums text-xs sm:text-sm">
                    {movesCount}
                  </span>
                </div>

                {/* Mistakes/Strikes limit view */}
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[#8A8A70] hidden xs:inline">{strictMistakes ? 'Strikes:' : 'Mistakes:'}</span>
                  <span className="text-[#8A8A70] xs:hidden">{strictMistakes ? 'S:' : 'X:'}</span>
                  <span 
                    className={`font-mono font-bold px-1.5 py-0.5 rounded-md text-xs sm:text-sm ${
                      mistakes > 0 ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-[#E8E6D1]/30 text-[#2D2D2A]'
                    }`}
                    title={strictMistakes ? "Limit 3 mistakes (Strikes Mode)" : "Unlimited mistakes allowed"}
                  >
                    {mistakes}{strictMistakes ? '/3' : ''}
                  </span>
                  {strictMistakes && mistakes >= 2 && !reviewMode && (
                    <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-rose-600 animate-bounce shrink-0" />
                  )}
                </div>
              </div>

              {/* Actions: Undo, Redo, Reset Board */}
              {!reviewMode && (
                <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                  <button
                    id="btn-undo"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="p-1 sm:p-2 border border-[#D4D9BA] rounded-lg sm:rounded-xl bg-white hover:bg-[#FDFCF0] disabled:opacity-30 disabled:pointer-events-none text-[#5A5A40] cursor-pointer transition shrink-0"
                    title="Undo Move"
                  >
                    <Undo2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  </button>
                  <button
                    id="btn-redo"
                    onClick={handleRedo}
                    disabled={redoStack.length === 0}
                    className="p-1 sm:p-2 border border-[#D4D9BA] rounded-lg sm:rounded-xl bg-white hover:bg-[#FDFCF0] disabled:opacity-30 disabled:pointer-events-none text-[#5A5A40] cursor-pointer transition shrink-0"
                    title="Redo Move"
                  >
                    <Redo2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  </button>
                  <button
                    id="btn-restart"
                    onClick={restartCurrentPuzzle}
                    className="p-1 sm:p-2 border border-[#D4D9BA] rounded-lg sm:rounded-xl bg-white hover:bg-[#FDFCF0] text-[#5A5A40] cursor-pointer transition shrink-0"
                    title="Reset Board"
                  >
                    <RotateCcw className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Board representation stage */}
            <div className="relative">
              <SudokuGrid
                board={board}
                selectedCell={reviewMode ? null : selectedCell}
                onCellSelect={handleCellSelect}
                onCellValueInput={handleNumberInput}
                showConflicts={showConflicts}
                highlightIdentical={highlightIdentical}
                onArrowNavigate={handleArrowNavigation}
                onDeleteInput={handleEraseClick}
              />

              {/* Pause Cover Mask */}
              <AnimatePresence>
                {gameStatus === 'paused' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-[#2D2D2A]/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-30 shadow-2xl"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5A5A40] text-white shadow-xl mb-4 animate-pulse-subtle">
                      <Pause className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-serif font-bold text-white">Puzzle Paused</h3>
                    <p className="text-[#D4D9BA] text-xs sm:text-sm mt-1.5 max-w-[280px]">
                      Board content is masked to keep selection safe and prevent external helpers.
                    </p>
                    <button
                      id="btn-resume-overlay"
                      onClick={() => setGameStatus('playing')}
                      className="mt-6 flex items-center gap-2 px-6 py-3 bg-[#5A5A40] hover:bg-[#4A4A32] active:scale-95 text-white text-sm font-bold rounded-xl shadow-md cursor-pointer transition-all border border-[#5A5A40]"
                    >
                      <Play className="h-4 w-4" />
                      Resume Puzzle
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Assistive dynamic clues */}
            {!reviewMode && (
              <AnimatePresence mode="wait">
                {toastMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="rounded-2xl border border-[#D4D9BA] bg-white p-4 shadow-sm flex items-start gap-3 mt-4"
                    id="sudoku-dynamic-toast"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E8E6D1]/40 text-[#5A5A40] shrink-0 mt-0.5">
                      <Lightbulb className="h-4.5 w-4.5 text-[#5A5A40] animate-pulse-subtle" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8A70]">Board Assistant Clue</h4>
                        <button onClick={() => setToastMessage(null)} className="text-[#5A5A40] hover:text-[#2D2D2A] cursor-pointer">
                          <span className="text-[10px] bg-[#E8E6D1]/30 hover:bg-[#E8E6D1]/60 px-1.5 py-0.5 rounded-md font-bold">dismiss</span>
                        </button>
                      </div>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#2D2D2A]">{toastMessage}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {/* Interactive Keyboard: Notes, Erase, Clear Notes, Hint, Numbers */}
            {!reviewMode && (
              <Keyboard
                onNumberClick={handleNumberInput}
                onEraseClick={handleEraseClick}
                onClearNotes={handleClearNotesOnly}
                onHintClick={handleHintClick}
                isPencilMode={isPencilMode}
                onTogglePencilMode={() => setIsPencilMode(!isPencilMode)}
                numberCounts={numberCounts}
                gridSize={gridSize}
              />
            )}
          </>
        )}

        {/* VIEW 3: DEDICATED ENDING RESULTS SCREEN */}
        {(gameStatus === 'completed' || gameStatus === 'failed') && !reviewMode && (
          <div className="rounded-2xl bg-white border border-[#D4D9BA]/70 p-6 sm:p-8 shadow-md text-center space-y-6 animate-fade-in">
            {gameStatus === 'completed' ? (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm border border-amber-100 relative animate-bounce">
                  <Award className="h-8 w-8 text-amber-500 animate-pulse" />
                  <Sparkles className="h-4 w-4 text-amber-400 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '6s' }} />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-[#2D2D2A]">Puzzle Solved!</h2>
                  <p className="text-xs sm:text-sm text-[#8A8A70] font-semibold max-w-xs mx-auto leading-relaxed">
                    Splendid dedication! You have successfully filled all required entries with perfect deduction.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 border border-rose-150 shadow-xs">
                  <AlertTriangle className="h-8 w-8 text-rose-600" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-rose-600">Game Over</h2>
                  <p className="text-xs sm:text-sm text-[#8A8A70] font-semibold max-w-xs mx-auto leading-relaxed">
                    Strike limit exceeded. 3 mistakes have occurred on this {difficulty} session grid.
                  </p>
                </div>
              </div>
            )}

            {/* Board Configuration Details */}
            <div className="flex gap-2 justify-center">
              <span className="px-3 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider text-[#5A5A40] bg-[#E8E6D1]/30 border-[#D4D9BA]">
                {gridSize}x{gridSize} Board Format
              </span>
              <span className={`px-3 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider ${DIFFICULTY_CONFIG[difficulty].color}`}>
                {difficulty} Grid
              </span>
            </div>

            {/* Performance Statistics Grid */}
            <div className="grid grid-cols-3 gap-3 bg-[#E8E6D1]/10 p-4 rounded-xl border border-[#D4D9BA]/35 font-mono text-center max-w-sm mx-auto">
              <div className="space-y-0.5">
                <span className="text-[#8A8A70] block font-sans font-bold uppercase tracking-wider text-[9px]">Solver Time</span>
                <strong className="text-lg text-[#2D2D2A] font-black flex items-center justify-center gap-1 leading-none">
                  <Clock className="h-3.5 w-3.5 text-[#5A5A40] shrink-0" />
                  {formatTimerValue(timer)}
                </strong>
              </div>
              <div className="space-y-0.5 border-x border-[#D4D9BA]/30">
                <span className="text-[#8A8A70] block font-sans font-bold uppercase tracking-wider text-[9px]">Valid Moves</span>
                <strong className="text-lg text-[#2D2D2A] font-black leading-none">
                  {movesCount}
                </strong>
              </div>
              <div className="space-y-0.5">
                <span className="text-[#8A8A70] block font-sans font-bold uppercase tracking-wider text-[9px]">Mistakes Info</span>
                <strong className={`text-lg font-black leading-none ${mistakes > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {mistakes}{strictMistakes ? '/3' : ''}
                </strong>
              </div>
            </div>

            {/* Streaks (shown on solved) */}
            {gameStatus === 'completed' && (
              <div className="text-xs font-semibold text-[#5A5A40] bg-white p-2.5 rounded-xl border border-[#D4D9BA]/45 max-w-xs mx-auto flex items-center justify-center gap-1 text-center font-mono">
                <Flame className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Win Streak: <strong className="text-amber-700">{stats.currentStreak[difficulty]}</strong> games in a row</span>
              </div>
            )}

            {/* Actions Panel */}
            <div className="space-y-2.5 pt-2 max-w-sm mx-auto">
              {gameStatus === 'failed' && (
                <button
                  onClick={handleContinueAfterFailure}
                  className="w-full py-3.5 px-4 rounded-xl bg-stone-850 hover:bg-stone-750 active:scale-95 text-stone-100 font-extrabold text-xs sm:text-sm transition-all border border-stone-850 cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                >
                  Clear Strikes & Resume This Board
                </button>
              )}

              <button
                onClick={() => startNewGame(difficulty, gridSize)}
                className="w-full py-3.5 px-4 rounded-xl bg-[#5A5A40] hover:bg-[#4A4A32] active:scale-95 text-white font-extrabold text-sm transition-all border border-[#5A5A40] cursor-pointer shadow-md flex items-center justify-center gap-1.5 font-serif"
              >
                Launch Fresh Puzzle
                <ChevronRight className="h-4.5 w-4.5" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setReviewMode(true)}
                  className="py-2.5 px-3 border border-[#D4D9BA] rounded-xl bg-white hover:bg-[#FDFCF0]/80 text-[#5A5A40] text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  Review Board
                </button>
                <button
                  onClick={() => {
                    setGameStatus('idle');
                    setReviewMode(false);
                  }}
                  className="py-2.5 px-3 border border-[#D4D9BA] rounded-xl bg-white hover:bg-[#FDFCF0]/80 text-[#5A5A40] text-xs font-bold transition cursor-pointer shadow-2xs"
                >
                  Setup Menu
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Helpful Popups modals references */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />
      
      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        stats={stats}
        onResetStats={handleResetStats}
      />
    </div>
  );
}
