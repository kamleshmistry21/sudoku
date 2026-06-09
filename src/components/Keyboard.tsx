import { motion } from 'motion/react';
import { Eraser, Lightbulb, Edit, Edit3, Trash2 } from 'lucide-react';

interface KeyboardProps {
  onNumberClick: (num: number) => void;
  onEraseClick: () => void;
  onClearNotes: () => void;
  onHintClick: () => void;
  isPencilMode: boolean;
  onTogglePencilMode: () => void;
  numberCounts: Record<number, number>; // Maps 1-12 to count of instances currently on board
  gridSize: 9 | 12;
}

export default function Keyboard({
  onNumberClick,
  onEraseClick,
  onClearNotes,
  onHintClick,
  isPencilMode,
  onTogglePencilMode,
  numberCounts,
  gridSize,
}: KeyboardProps) {
  const numRange = gridSize === 12 
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] 
    : [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const targetMax = gridSize === 12 ? 12 : 9;

  const getLabel = (num: number): string => {
    if (gridSize === 12) {
      const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B'];
      if (num >= 1 && num <= 12) {
        return symbols[num - 1];
      }
    }
    return num.toString();
  };

  return (
    <div 
      className={`w-full mx-auto space-y-3 sm:space-y-4 px-1 ${
        gridSize === 12 ? 'max-w-[500px]' : 'max-w-[460px]'
      }`} 
      id="sudoku-keyboard-controls"
    >
      {/* Action Buttons: Pencil, Erase, Clear Notes, Hint */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {/* Pencil Toggle */}
        <button
          id="btn-pencil"
          onClick={onTogglePencilMode}
          className={`
            relative flex flex-col items-center justify-center gap-1 py-1.5 sm:py-2.5 px-1.5 sm:px-2 rounded-xl border text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95
            ${
              isPencilMode
                ? 'bg-[#5A5A40] border-[#5A5A40] text-white shadow-md'
                : 'bg-white border-[#D4D9BA] text-[#5A5A40] hover:bg-[#FDFCF0]'
            }
          `}
        >
          <div className="flex items-center gap-1">
            {isPencilMode ? <Edit3 className="h-4 w-4 animate-bounce" /> : <Edit className="h-4 w-4" />}
          </div>
          <span>Notes {isPencilMode ? 'ON' : 'OFF'}</span>
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            {isPencilMode && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4D9BA] opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPencilMode ? 'bg-emerald-600' : 'bg-transparent'}`}></span>
          </span>
        </button>

        {/* Erase Cell Value */}
        <button
          id="btn-erase"
          onClick={onEraseClick}
          className="flex flex-col items-center justify-center gap-1 py-1.5 sm:py-2.5 px-1.5 sm:px-2 rounded-xl border border-[#D4D9BA] bg-white text-[#2D2D2A] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all shadow-xs cursor-pointer active:scale-95 text-[11px] sm:text-xs font-semibold"
        >
          <Eraser className="h-4 w-4 text-[#5A5A40]" />
          <span>Erase Cell</span>
        </button>

        {/* Clear Cell Notes Only */}
        <button
          id="btn-clear-notes"
          onClick={onClearNotes}
          className="flex flex-col items-center justify-center gap-1 py-1.5 sm:py-2.5 px-1.5 sm:px-2 rounded-xl border border-[#D4D9BA] bg-white text-[#2D2D2A] hover:bg-stone-50 hover:text-[#5A5A40] transition-all shadow-xs cursor-pointer active:scale-95 text-[11px] sm:text-xs font-semibold"
          title="Clear prospective pencil marks in selected cell"
        >
          <Trash2 className="h-4 w-4 text-[#8A8A70]" />
          <span>Clear Notes</span>
        </button>

        {/* Smart Hint */}
        <button
          id="btn-hint"
          onClick={onHintClick}
          className="flex flex-col items-center justify-center gap-1 py-1.5 sm:py-2.5 px-1.5 sm:px-2 rounded-xl border border-dashed border-[#D4D9BA] bg-[#E8E6D1]/30 text-[#5A5A40] hover:bg-[#E8E6D1]/50 transition-all shadow-xs cursor-pointer active:scale-95 text-[11px] sm:text-xs font-bold"
        >
          <div className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4 text-amber-600 animate-pulse-subtle" />
          </div>
          <span>Smart Hint</span>
        </button>
      </div>

      {/* Number Pad Grid */}
      <div 
        className={`grid gap-1.5 bg-[#E8E6D1]/25 p-1.5 rounded-2xl border border-[#D4D9BA]/50 shadow-inner ${
          gridSize === 12 ? 'grid-cols-6' : 'grid-cols-9'
        }`}
      >
        {numRange.map((num) => {
          const count = numberCounts[num] || 0;
          const isCompleted = count >= targetMax;

          return (
            <button
              id={`numpad-${num}`}
              key={num}
              onClick={() => onNumberClick(num)}
              className={`
                relative flex flex-col items-center justify-between py-2 sm:py-3 rounded-xl font-serif text-base sm:text-lg font-bold transition-all shadow-sm cursor-pointer active:scale-90 select-none
                ${
                  isCompleted
                    ? 'bg-stone-100 text-stone-300 border border-stone-200'
                    : 'bg-[#FDFCF0] border border-[#D4D9BA] text-[#2D2D2A] hover:bg-[#5A5A40] hover:text-white hover:border-[#5A5A40]'
                }
              `}
            >
              <span className={isCompleted ? 'line-through text-stone-300 decoration-2 decoration-stone-200' : ''}>
                {getLabel(num)}
              </span>
              
              {/* Remaining Count Dot Indicator */}
              <div className="mt-1 flex gap-0.5 justify-center items-center font-sans">
                {isCompleted ? (
                  <span className="text-[8px] px-1 py-0 bg-emerald-50 text-emerald-700 rounded font-bold">✓</span>
                ) : (
                  <span className="text-[8px] font-semibold text-[#8A8A70]">
                    {targetMax - count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
