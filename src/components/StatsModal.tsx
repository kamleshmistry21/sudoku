import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Timer, Award, Flame, RefreshCw, BarChart2 } from 'lucide-react';
import { GameStats, Difficulty } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: GameStats;
  onResetStats: () => void;
}

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

const DIFFICULTY_COLORS: Record<Difficulty, { bg: string; text: string; border: string }> = {
  easy: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
  hard: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  expert: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-100' },
};

// Helper to format time in mm:ss
function formatTime(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function StatsModal({ isOpen, onClose, stats, onResetStats }: StatsModalProps) {
  const difficulties: Difficulty[] = ['easy', 'medium', 'hard', 'expert'];

  // Sum up overall stats
  const totalPlayed = Object.values(stats.gamesPlayed).reduce((sum, n) => sum + n, 0);
  const totalWon = Object.values(stats.gamesWon).reduce((sum, n) => sum + n, 0);
  const winPercent = totalPlayed > 0 ? Math.round((totalWon / totalPlayed) * 100) : 0;

  const handleResetWithConfirm = () => {
    if (confirm('Are you absolute sure you want to reset all your Sudoku statistics? This cannot be undone.')) {
      onResetStats();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#2D2D2A]/65 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-[#D4D9BA] max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#D4D9BA]/60 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8E6D1]/50 text-[#5A5A40]">
                  <Trophy className="h-5.5 w-5.5" style={{ strokeWidth: 2.5 }} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#2D2D2A]">Your Statistics</h3>
                  <p className="text-xs text-[#8A8A70]">Track and beat your achievements</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A8A70] hover:bg-[#FDFCF0] hover:text-[#5A5A40] transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content Container */}
            <div className="overflow-y-auto pr-1 flex-1 space-y-6">
              {/* Overall Summary Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-[#D4D9BA]/60 bg-stone-50 p-3 text-center">
                  <div className="text-2xl font-black text-[#2D2D2A] font-serif">{totalPlayed}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A70] mt-0.5">Played</div>
                </div>
                <div className="rounded-xl border border-[#D4D9BA]/60 bg-stone-50 p-3 text-center">
                  <div className="text-2xl font-black text-[#2D2D2A] font-serif">{totalWon}</div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-[#8A8A70] mt-0.5">Won</div>
                </div>
                <div className="rounded-xl border border-[#5A5A40]/30 bg-[#E8E6D1]/30 p-3 text-center">
                  <div className="text-2xl font-black text-[#5A5A40] font-serif">{winPercent}%</div>
                  <div className="text-[10px] uppercase font-extrabold tracking-wider text-[#5A5A40] mt-0.5">Win Rate</div>
                </div>
              </div>

              {/* Stats by Difficulty */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8A70] flex items-center gap-1.5 px-0.5">
                  <BarChart2 className="h-4 w-4" />
                  Breakdown by Difficulty
                </h4>

                <div className="space-y-2.5">
                  {difficulties.map((difficulty) => {
                    const played = stats.gamesPlayed[difficulty];
                    const won = stats.gamesWon[difficulty];
                    const best = stats.bestTime[difficulty];
                    const streak = stats.currentStreak[difficulty];
                    const cls = DIFFICULTY_COLORS[difficulty] || { bg: 'bg-stone-50', text: 'text-stone-700', border: 'border-stone-100' };
                    const rate = played > 0 ? Math.round((won / played) * 100) : 0;

                    return (
                      <div
                        key={difficulty}
                        className="rounded-xl border border-[#D4D9BA]/50 p-3.5 hover:shadow-xs transition-shadow bg-white"
                      >
                        {/* Title and Badges */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-block px-2.5 py-0.5 text-xs font-bold rounded-lg border ${cls.bg} ${cls.text} ${cls.border}`}>
                            {DIFFICULTY_LABELS[difficulty]}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Flame className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                              Streak: <strong className="font-mono text-slate-700">{streak}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Metric Row Grid */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="border-r border-[#D4D9BA]/30">
                            <span className="text-[#8A8A70] block mb-0.5">Games</span>
                            <span className="font-semibold text-[#2D2D2A] font-serif">{won}/{played} <span className="text-[10px] text-[#8A8A70]">({rate}%)</span></span>
                          </div>
                          <div className="border-r border-[#D4D9BA]/30 pl-2">
                            <span className="text-[#8A8A70] block mb-0.5">Best Time</span>
                            <span className="font-semibold text-[#2D2D2A] font-serif flex items-center gap-1">
                              <Timer className="h-3.5 w-3.5 text-[#5A5A40] shrink-0" />
                              {formatTime(best)}
                            </span>
                          </div>
                          <div className="pl-2">
                            <span className="text-[#8A8A70] block mb-0.5">Status</span>
                            <span className="font-semibold text-[#2D2D2A] font-serif">
                              {won > 0 ? (
                                <span className="text-[#5A5A40] font-bold">Solved</span>
                              ) : played > 0 ? (
                                <span className="text-stone-500">Unsolved</span>
                              ) : (
                                <span className="text-stone-300">No Play</span>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Tiny win rate progress bar */}
                        {played > 0 && (
                          <div className="w-full bg-[#E8E6D1]/40 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div
                              className="bg-[#5A5A40] h-full rounded-full transition-all duration-500"
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer containing reset button */}
            <div className="border-t border-[#D4D9BA]/60 pt-4 mt-5 flex items-center justify-between">
              <button
                onClick={handleResetWithConfirm}
                className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-lg transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset Record
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-[#5A5A40] text-white hover:bg-[#4A4A32] active:scale-95 transition-all text-sm font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
