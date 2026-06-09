import { Difficulty, Board, Cell } from '../types';

// Helper to check if a number can be placed in a cell
export function isValid(grid: number[][], row: number, col: number, num: number): boolean {
  const size = grid.length;
  
  // Check row
  for (let x = 0; x < size; x++) {
    if (grid[row][x] === num) return false;
  }

  // Check column
  for (let x = 0; x < size; x++) {
    if (grid[x][col] === num) return false;
  }

  // Check box (3x3 for 9x9, 3x4 for 12x12)
  const blockRows = 3;
  const blockCols = size === 12 ? 4 : 3;
  const startRow = row - (row % blockRows);
  const startCol = col - (col % blockCols);
  for (let i = 0; i < blockRows; i++) {
    for (let j = 0; j < blockCols; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

// Find grid empty cell with Minimum Remaining Values (MRV)
function findBestEmptyCell(grid: number[][], size: number, blockRows: number, blockCols: number) {
  let minCandidates = size + 1;
  let bestRow = -1;
  let bestCol = -1;
  let bestCandidates: number[] = [];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 0) {
        const candidates: number[] = [];
        for (let num = 1; num <= size; num++) {
          if (isValid(grid, r, c, num)) {
            candidates.push(num);
          }
        }
        
        if (candidates.length === 0) {
          return { row: r, col: c, candidates: [] };
        }

        if (candidates.length < minCandidates) {
          minCandidates = candidates.length;
          bestRow = r;
          bestCol = c;
          bestCandidates = candidates;
        }
      }
    }
  }

  return { row: bestRow, col: bestCol, candidates: bestCandidates };
}

// Solver that counts solutions (up to a limit) using MRV
export function countSolutions(grid: number[][], limit = 2): number {
  let count = 0;
  const size = grid.length;
  const blockRows = 3;
  const blockCols = size === 12 ? 4 : 3;

  function solve() {
    if (count >= limit) return;

    const { row, col, candidates } = findBestEmptyCell(grid, size, blockRows, blockCols);
    if (row === -1) {
      count++;
      return;
    }

    for (const num of candidates) {
      grid[row][col] = num;
      solve();
      grid[row][col] = 0;
    }
  }

  const gridCopy = grid.map(row => [...row]);
  solve();
  return count;
}

// Solve a grid in place, returning true if solvable (and modifying the grid to the solution) using MRV
export function solveSudoku(grid: number[][]): boolean {
  const size = grid.length;
  const blockRows = 3;
  const blockCols = size === 12 ? 4 : 3;

  function solve(): boolean {
    const { row, col, candidates } = findBestEmptyCell(grid, size, blockRows, blockCols);
    if (row === -1) return true;

    for (const num of candidates) {
      grid[row][col] = num;
      if (solve()) return true;
      grid[row][col] = 0;
    }

    return false;
  }

  return solve();
}

// Shuffle array helper
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Generate a completed Sudoku board
export function generateFullGrid(size: number = 9): number[][] {
  const blockRows = 3;
  const blockCols = size === 12 ? 4 : 3;
  const grid = Array(size).fill(null).map(() => Array(size).fill(0));

  // Seed diagonal blocks horizontally
  if (size === 9) {
    for (let i = 0; i < 9; i += 3) {
      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      let idx = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          grid[i + r][i + c] = nums[idx++];
        }
      }
    }
  } else {
    // 12x12
    const all12 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    for (let i = 0; i < 3; i++) {
      const rowOffset = i * 3;
      const colOffset = i * 4;
      const nums = shuffle(all12);
      let idx = 0;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 4; c++) {
          grid[rowOffset + r][colOffset + c] = nums[idx++];
        }
      }
    }
  }

  function solveRandomly(): boolean {
    const { row, col, candidates } = findBestEmptyCell(grid, size, blockRows, blockCols);
    if (row === -1) return true;

    const shuffled = shuffle(candidates);
    for (const num of shuffled) {
      grid[row][col] = num;
      if (solveRandomly()) return true;
      grid[row][col] = 0;
    }

    return false;
  }

  solveRandomly();
  return grid;
}

// Create a puzzle from a solved grid by removing numbers
export function generatePuzzle(difficulty: Difficulty, size: number = 9): { grid: number[][]; solution: number[][] } {
  const solution = generateFullGrid(size);
  const grid = solution.map(row => [...row]);

  // Determine clue target based on difficulty and size
  let targetClues = size === 12 ? 75 : 45;
  if (difficulty === 'medium') targetClues = size === 12 ? 60 : 35;
  if (difficulty === 'hard') targetClues = size === 12 ? 48 : 28;
  if (difficulty === 'expert') targetClues = size === 12 ? 38 : 22;

  // Create a list of all cells to attempt removal
  const cells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cells.push({ r, c });
    }
  }
  const shuffledCells = shuffle(cells);

  let currentCluesCount = size * size;
  let maxFailures = size === 12 ? 15 : 40; // fail-fast on 12x12
  let failures = 0;

  for (const { r, c } of shuffledCells) {
    if (currentCluesCount <= targetClues || failures >= maxFailures) {
      break;
    }

    const temp = grid[r][c];
    grid[r][c] = 0;

    // Check if the board still has exactly ONE solution
    const solutionsCount = countSolutions(grid, 2);

    if (solutionsCount === 1) {
      currentCluesCount--;
    } else {
      // Revert if it doesn't have a unique solution
      grid[r][c] = temp;
      failures++;
    }
  }

  return { grid, solution };
}

// Convert a number[][] grid to a Board data structure
export function createGameBoard(difficulty: Difficulty, size: number = 9): Board {
  const { grid, solution } = generatePuzzle(difficulty, size);
  const board: Board = [];

  for (let r = 0; r < size; r++) {
    const rowCells: Cell[] = [];
    for (let c = 0; c < size; c++) {
      const val = grid[r][c];
      rowCells.push({
        row: r,
        col: c,
        value: val,
        solution: solution[r][c],
        isGiven: val !== 0,
        pencilMarks: [],
      });
    }
    board.push(rowCells);
  }

  return board;
}

// Check if a board is completely solved correctly
export function isGameSolved(board: Board): boolean {
  const size = board.length;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c].value !== board[r][c].solution) return false;
    }
  }
  return true;
}

// Find a single hint to suggest to the user.
export interface HintDetail {
  row: number;
  col: number;
  value: number;
  type: 'reveal' | 'correction' | 'single';
  message: string;
}

export function getHint(board: Board, selectedRow: number | null, selectedCol: number | null): HintDetail | null {
  const size = board.length;
  
  const getSymbol = (val: number): string => {
    if (size === 12) {
      const symbols = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B'];
      if (val >= 1 && val <= 12) return symbols[val - 1];
    }
    return val.toString();
  };
  
  // 1. First, check if there are wrong values entered (not including empty inputs)
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      if (cell.value !== 0 && !cell.isGiven && cell.value !== cell.solution) {
        return {
          row: r,
          col: c,
          value: cell.solution,
          type: 'correction',
          message: `The value at Row ${r + 1}, Column ${c + 1} is incorrect. The correct symbol should be ${getSymbol(cell.solution)}.`
        };
      }
    }
  }

  // 2. If a specific empty cell is selected, let's provide a hint for it
  if (selectedRow !== null && selectedCol !== null) {
    if (selectedRow < size && selectedCol < size) {
      const cell = board[selectedRow][selectedCol];
      if (cell.value === 0) {
        return {
          row: selectedRow,
          col: selectedCol,
          value: cell.solution,
          type: 'reveal',
          message: `For the selected cell at Row ${selectedRow + 1}, Column ${selectedCol + 1}, the correct symbol is ${getSymbol(cell.solution)}.`
        };
      }
    }
  }

  // 3. Look for any empty cell and reveal its correct value
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = board[r][c];
      if (cell.value === 0) {
        return {
          row: r,
          col: c,
          value: cell.solution,
          type: 'single',
          message: `Let's fill in Row ${r + 1}, Column ${c + 1} with the correct symbol: ${getSymbol(cell.solution)}.`
        };
      }
    }
  }

  return null;
}
