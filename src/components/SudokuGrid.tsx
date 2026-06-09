import { Cell, Board } from '../types';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// Helper to determine fully solved rows, columns, and 3x3 or 3x4 layout boxes
const getCompletedGroupKeys = (currentBoard: Board): Set<string> => {
  const completed = new Set<string>();
  const size = currentBoard.length;

  // Check rows
  for (let r = 0; r < size; r++) {
    let rowOk = true;
    for (let c = 0; c < size; c++) {
      const cell = currentBoard[r][c];
      if (cell.value === 0 || cell.value !== cell.solution) {
        rowOk = false;
        break;
      }
    }
    if (rowOk) {
      completed.add(`row-${r}`);
    }
  }

  // Check columns
  for (let c = 0; c < size; c++) {
    let colOk = true;
    for (let r = 0; r < size; r++) {
      const cell = currentBoard[r][c];
      if (cell.value === 0 || cell.value !== cell.solution) {
        colOk = false;
        break;
      }
    }
    if (colOk) {
      completed.add(`col-${c}`);
    }
  }

  // Check subgrid boxes
  const blockRows = 3;
  const blockCols = size === 12 ? 4 : 3;
  const numBlocksX = size / blockCols;
  const numBlocksY = size / blockRows;

  for (let by = 0; by < numBlocksY; by++) {
    for (let bx = 0; bx < numBlocksX; bx++) {
      const startRow = by * blockRows;
      const startCol = bx * blockCols;
      let blockOk = true;
      for (let r = startRow; r < startRow + blockRows; r++) {
        for (let c = startCol; c < startCol + blockCols; c++) {
          const cell = currentBoard[r][c];
          if (cell.value === 0 || cell.value !== cell.solution) {
            blockOk = false;
            break;
          }
        }
        if (!blockOk) break;
      }
      if (blockOk) {
        completed.add(`box-${by}-${bx}`);
      }
    }
  }

  return completed;
};

interface SudokuGridProps {
  board: Board;
  selectedCell: { row: number; col: number } | null;
  onCellSelect: (row: number, col: number) => void;
  onCellValueInput: (value: number) => void;
  showConflicts: boolean;
  highlightIdentical: boolean;
  onArrowNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void;
  onDeleteInput: () => void;
}

export default function SudokuGrid({
  board,
  selectedCell,
  onCellSelect,
  onCellValueInput,
  showConflicts,
  highlightIdentical,
  onArrowNavigate,
  onDeleteInput,
}: SudokuGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const size = board.length;

  const prevCompletedGroupsRef = useRef<Set<string>>(new Set());
  const prevFilledCountRef = useRef<number>(0);
  const [animatingCells, setAnimatingCells] = useState<Record<string, { delay: number }>>({});

  useEffect(() => {
    let filledCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (board[r][c].value > 0) filledCount++;
      }
    }

    const currentCompleted = getCompletedGroupKeys(board);

    // If board changes size or filled cells decrease substantially (indicates reset or new board),
    // update reference baseline without playing waves.
    if (board.length !== size || filledCount < prevFilledCountRef.current - 1) {
      prevCompletedGroupsRef.current = currentCompleted;
      prevFilledCountRef.current = filledCount;
      setAnimatingCells({});
      return;
    }

    prevFilledCountRef.current = filledCount;

    const newlyCompleted: string[] = [];
    currentCompleted.forEach((groupKey) => {
      if (!prevCompletedGroupsRef.current.has(groupKey)) {
        newlyCompleted.push(groupKey);
      }
    });

    if (newlyCompleted.length > 0) {
      const blockRows = 3;
      const blockCols = size === 12 ? 4 : 3;
      const newAnimations: Record<string, { delay: number }> = {};

      newlyCompleted.forEach((groupKey) => {
        if (groupKey.startsWith('row-')) {
          const r = parseInt(groupKey.split('-')[1], 10);
          for (let c = 0; c < size; c++) {
            const key = `${r}-${c}`;
            const delay = c * 50;
            newAnimations[key] = { delay };
          }
        } else if (groupKey.startsWith('col-')) {
          const c = parseInt(groupKey.split('-')[1], 10);
          for (let r = 0; r < size; r++) {
            const key = `${r}-${c}`;
            const delay = r * 50;
            newAnimations[key] = { delay };
          }
        } else if (groupKey.startsWith('box-')) {
          const parts = groupKey.split('-');
          const by = parseInt(parts[1], 10);
          const bx = parseInt(parts[2], 10);
          const startRow = by * blockRows;
          const startCol = bx * blockCols;

          for (let r = startRow; r < startRow + blockRows; r++) {
            for (let c = startCol; c < startCol + blockCols; c++) {
              const key = `${r}-${c}`;
              const localR = r - startRow;
              const localC = c - startCol;
              const delay = (localR + localC) * 60;
              newAnimations[key] = { delay };
            }
          }
        }
      });

      setAnimatingCells((prev) => ({
        ...prev,
        ...newAnimations,
      }));

      const timeoutId = setTimeout(() => {
        setAnimatingCells((prev) => {
          const updated = { ...prev };
          Object.keys(newAnimations).forEach((key) => {
            delete updated[key];
          });
          return updated;
        });
      }, 1500);

      prevCompletedGroupsRef.current = currentCompleted;
      return () => clearTimeout(timeoutId);
    }

    prevCompletedGroupsRef.current = currentCompleted;
  }, [board, size]);


  const getCellLabel = (val: number): string => {
    if (size === 12) {
      const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B'];
      if (val >= 1 && val <= 12) {
        return symbols[val - 1];
      }
    }
    return val.toString();
  };

  // Capture keyboard events for arrow navigation, number entry, and cell deletion
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!selectedCell) return;

      const key = e.key;

      if (key === 'ArrowUp' || (size === 9 && (key === 'w' || key === 'W'))) {
        e.preventDefault();
        onArrowNavigate('up');
      } else if (key === 'ArrowDown' || (size === 9 && (key === 's' || key === 'S'))) {
        e.preventDefault();
        onArrowNavigate('down');
      } else if (key === 'ArrowLeft' || (size === 9 && (key === 'a' || key === 'A'))) {
        e.preventDefault();
        onArrowNavigate('left');
      } else if (key === 'ArrowRight' || (size === 9 && (key === 'd' || key === 'D'))) {
        e.preventDefault();
        onArrowNavigate('right');
      } else if (size === 9 && key >= '1' && key <= '9') {
        onCellValueInput(parseInt(key, 10));
      } else if (size === 12 && key >= '0' && key <= '9') {
        onCellValueInput(parseInt(key, 10) + 1);
      } else if (size === 12 && (key === 'a' || key === 'A')) {
        onCellValueInput(11);
      } else if (size === 12 && (key === 'b' || key === 'B')) {
        onCellValueInput(12);
      } else if (key === 'Backspace' || key === 'Delete') {
        onDeleteInput();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedCell, onArrowNavigate, onCellValueInput, onDeleteInput, size]);

  // Determine if a cell is highlighted as matching identical values
  const getSelectedValue = (): number => {
    if (!selectedCell) return 0;
    const { row, col } = selectedCell;
    return board[row][col].value;
  };

  const selectedVal = getSelectedValue();

  // Highlight criteria: row, column, or matching block
  const isKindred = (r: number, c: number): boolean => {
    if (!selectedCell) return false;
    const { row, col } = selectedCell;
    if (row === r || col === c) return true;

    // Disable block/box highlighting for twelve (12x12) size on selection
    if (size === 12) return false;

    // Check same block (3x3 for 9x9)
    const blockRows = 3;
    const blockCols = 3;

    const sRow = row - (row % blockRows);
    const sCol = col - (col % blockCols);
    const rRow = r - (r % blockRows);
    const rCol = c - (c % blockCols);
    return sRow === rRow && sCol === rCol;
  };

  // Determine conflicts on the board
  const hasConflict = (cell: Cell): boolean => {
    if (!showConflicts || cell.value === 0) return false;

    // Check same row
    for (let c = 0; c < size; c++) {
      if (c !== cell.col && board[cell.row][c].value === cell.value) return true;
    }

    // Check same column
    for (let r = 0; r < size; r++) {
      if (r !== cell.row && board[r][cell.col].value === cell.value) return true;
    }

    // Check same subgrid
    const blockRows = 3;
    const blockCols = size === 12 ? 4 : 3;
    const sRow = cell.row - (cell.row % blockRows);
    const sCol = cell.col - (cell.col % blockCols);
    for (let r = sRow; r < sRow + blockRows; r++) {
      for (let c = sCol; c < sCol + blockCols; c++) {
        if ((r !== cell.row || c !== cell.col) && board[r][c].value === cell.value) {
          return true;
        }
      }
    }

    return false;
  };

  // Helper arrays for candidate marks
  const numCandidates = Array.from({ length: size }, (_, i) => i + 1);

  return (
    <div 
      id="sudoku-grid-container"
      ref={containerRef}
      className={`w-full mx-auto bg-[#5A5A40] p-[2px] sm:p-2 rounded-2xl shadow-xl border-2 sm:border-4 border-[#5A5A40] touch-none select-none overflow-hidden relative ${
        size === 12 ? 'max-w-[500px]' : 'max-w-[460px]'
      } aspect-square`}
    >
      <div 
        className="grid h-full w-full gap-[1px] sm:gap-[1.5px] bg-[#D4D9BA]"
        style={{
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
        }}
      >
        {board.map((rowCells, rIndex) =>
          rowCells.map((cell, cIndex) => {
            const isSel = selectedCell?.row === rIndex && selectedCell?.col === cIndex;
            const isKind = isKindred(rIndex, cIndex);
            const isIdenVal = highlightIdentical && selectedVal > 0 && cell.value === selectedVal;
            const hasConf = hasConflict(cell);
            const isErrUser = cell.value > 0 && !cell.isGiven && cell.value !== cell.solution;

            // Box boundaries
            const blockRows = 3;
            const blockCols = size === 12 ? 4 : 3;

            const isBoxBoundaryRight = (cIndex + 1) % blockCols === 0 && (cIndex + 1) !== size;
            const isBoxBoundaryBottom = (rIndex + 1) % blockRows === 0 && (rIndex + 1) !== size;

            const borderRight = isBoxBoundaryRight ? 'border-r-2 sm:border-r-[3px] border-[#5A5A40]' : '';
            const borderBottom = isBoxBoundaryBottom ? 'border-b-2 sm:border-b-[3px] border-[#5A5A40]' : '';

            // Pure Zen Natural Tones palette
            let bgClass = 'bg-white';
            let textClass = 'text-[#2D2D2A]';

            if (cell.isGiven) {
              bgClass = 'bg-[#FDFCF0]/90';
              textClass = 'text-[#5A5A40] font-black';
            } else {
              textClass = 'text-blue-600 font-black';
            }

            // Highlight weights
            if (isKind) {
              bgClass = cell.isGiven ? 'bg-[#E8E6D1]/65' : 'bg-[#E8E6D1]/50';
            }
            if (isIdenVal) {
              bgClass = 'bg-[#D4D9BA]';
              textClass = cell.isGiven ? 'text-[#5A5A40] font-black' : 'text-blue-700 font-black';
            }
            if (hasConf || (showConflicts && isErrUser)) {
              bgClass = 'bg-rose-100/95';
              textClass = 'text-rose-700 font-extrabold';
            }
            if (isSel) {
              bgClass = 'bg-[#C5C9A4]';
            }

            const cellKey = `${rIndex}-${cIndex}`;
            const isAnimating = cellKey in animatingCells;
            const animDelay = animatingCells[cellKey]?.delay ?? 0;

            return (
              <button
                key={cellKey}
                id={`sudoku-cell-${cellKey}`}
                onClick={() => onCellSelect(rIndex, cIndex)}
                style={isAnimating ? { animationDelay: `${animDelay}ms` } : undefined}
                className={`
                  relative h-full w-full flex items-center justify-center transition-all cursor-pointer outline-none focus:outline-none
                  ${bgClass} ${textClass}
                  ${borderRight} ${borderBottom}
                  ${isSel ? 'ring-[1.5px] sm:ring-2 ring-[#5A5A40] ring-inset z-10' : ''}
                  ${isAnimating ? 'animate-completion-shine' : ''}
                `}
              >
                {cell.value > 0 ? (
                  <motion.span
                    initial={{ scale: 0.82 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 350 }}
                    className={`font-serif leading-none ${
                      size === 12 
                        ? 'text-xs sm:text-base md:text-xl' 
                        : 'text-base sm:text-lg md:text-2xl'
                    }`}
                  >
                    {getCellLabel(cell.value)}
                  </motion.span>
                ) : (
                  // Pencil Marks inside empty cell
                  <div 
                    className={`grid h-full w-full p-[1px] sm:p-0.5 leading-none text-[#8A8A70] font-mono select-none ${
                      size === 12 
                        ? 'grid-cols-4 grid-rows-3 text-[6px] sm:text-[8px]' 
                        : 'grid-cols-3 grid-rows-3 text-[8px] sm:text-[10px]'
                    }`}
                  >
                    {numCandidates.map((num) => {
                      const hasMark = cell.pencilMarks.includes(num);
                      return (
                        <div
                          key={num}
                          className={`flex items-center justify-center transition-opacity ${
                            hasMark ? 'opacity-100 font-bold text-[#5A5A40] scale-105' : 'opacity-0'
                          }`}
                        >
                          {getCellLabel(num)}
                        </div>
                      );
                    })}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
