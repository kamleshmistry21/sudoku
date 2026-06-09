import { motion, AnimatePresence } from 'motion/react';
import { X, HelpCircle, Check, Info, Award, Calendar } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
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

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.95, y: 15, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 15, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-[#D4D9BA] max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#D4D9BA]/60 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8E6D1]/50 text-[#5A5A40]">
                  <HelpCircle className="h-5.5 w-5.5" style={{ strokeWidth: 2.5 }} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#2D2D2A]">How to Play</h3>
                  <p className="text-xs text-[#8A8A70]">The rules and strategies of Sudoku</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A8A70] hover:bg-[#FDFCF0] hover:text-[#5A5A40] transition-all cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="overflow-y-auto pr-1 flex-1 space-y-5 text-sm text-slate-705">
              <div className="space-y-2">
                <h4 className="font-bold text-[#2D2D2A] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5A5A40] text-xs font-bold text-white">1</span>
                  The Objective
                </h4>
                <p className="leading-relaxed pl-7 text-slate-700">
                  Sudoku is a logic-based number puzzle. The goal is to fill a <strong className="text-[#2D2D2A] font-bold">9×9 grid</strong> with digits so that each column, each row, and each of the nine <strong className="text-[#2D2D2A] font-bold">3×3 subgrids</strong> contain all of the digits from <strong className="text-[#2D2D2A] font-bold font-serif text-[#5A5A40]">1 to 9</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#2D2D2A] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5A5A40] text-xs font-bold text-white">2</span>
                  Key Constraints
                </h4>
                <ul className="space-y-1.5 pl-7 list-disc text-slate-700">
                  <li>Every row must contain numbers <span className="font-mono bg-[#E8E6D1]/30 border border-[#D4D9BA]/50 px-1 rounded text-xs text-[#5A5A40] font-bold">1-9</span> exactly once.</li>
                  <li>Every column must contain numbers <span className="font-mono bg-[#E8E6D1]/30 border border-[#D4D9BA]/50 px-1 rounded text-xs text-[#5A5A40] font-bold">1-9</span> exactly once.</li>
                  <li>Every 3×3 square box must contain numbers <span className="font-mono bg-[#E8E6D1]/30 border border-[#D4D9BA]/50 px-1 rounded text-xs text-[#5A5A40] font-bold">1-9</span> exactly once.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-[#2D2D2A] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5A5A40] text-xs font-bold text-white">3</span>
                  Useful Tips & Features
                </h4>
                <div className="pl-7 space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <span className="mt-0.5 rounded-md bg-[#E8E6D1] px-1.5 py-0.5 text-[#5A5A40] font-sans text-xs font-extrabold shrink-0">Notes</span>
                    <p className="leading-relaxed text-slate-700">
                      Toggle <strong className="text-[#2D2D2A] font-bold">Pencil/Notes mode</strong> to jot down possibilities (candidates) inside any empty cell. This is vital for harder difficulties!
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="mt-0.5 rounded-md bg-[#D4D9BA]/60 px-1.5 py-0.5 text-[#5A5A40] font-sans text-xs font-extrabold shrink-0">Hints</span>
                    <p className="leading-relaxed text-slate-700">
                      Stuck? Clicking <strong className="text-[#2D2D2A] font-bold">Hint</strong> will automatically check the board, correct any mistyped cell, or reveal the correct number for your selected empty cell.
                    </p>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="mt-0.5 rounded-md bg-[#5A5A40]/10 px-1.5 py-0.5 text-[#5A5A40] font-sans text-xs font-extrabold shrink-0">Checker</span>
                    <p className="leading-relaxed text-slate-700">
                      Enable <strong className="text-[#2D2D2A] font-bold">Auto-check Conflicts</strong> to highlight duplicate values in the same row, column, or block in real time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[#E8E6D1]/20 p-3.5 border border-[#D4D9BA]/50 flex items-start gap-2.5 mt-2">
                <Info className="h-5 w-5 text-[#8A8A70] shrink-0 mt-0.5 animate-pulse-subtle" />
                <p className="text-xs leading-normal text-[#8A8A70] font-medium">
                  A classic Sudoku board always has a single valid mathematical solution. Use pure process of elimination—no guesswork is required!
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#D4D9BA]/60 pt-4 mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#5A5A40] font-semibold text-white hover:bg-[#4A4A32] active:scale-95 transition-all text-sm shadow-sm cursor-pointer"
              >
                <Check className="h-4.5 w-4.5" />
                Got It
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
