export const Cells = {
  Empty: 0,
  Stone: 1,
  Goal: 2,
};

export type Cell = typeof Cells[keyof typeof Cells];

export type Board = {
  cells: Cell[][];
  width: number;
  height: number;
};

export function createBoard(options: { width: number; height: number }): Board {
  const { width, height } = options;
  if (width < 3 || height < 3) {
    throw new Error("Board must have at least 3x3 cells");
  }

  const cells: Cell[][] = [];
  for (let i = 0; i < height; i++) {
    const row: Cell[] = [];
    for (let j = 0; j < width; j++) {
      if (i <= 0 || j <= 0 || i >= height - 1 || j >= width - 1) {
        row.push(Cells.Stone);
      } else {
        row.push(Cells.Empty);
      }
    }
    cells.push(row);
  }

  return {
    cells,
    width,
    height,
  };
}

export function copyBoard(board: Board): Board {
  return {
    width: board.width,
    height: board.height,
    cells: board.cells.map((row) => row.slice()),
  };
}
export function copyBoardTo(board: Board, target: Board) {
  for (let i = 0; i < board.cells.length; i++) {
    for (let j = 0; j < board.cells[i].length; j++) {
      target.cells[i][j] = board.cells[i][j];
    }
  }
}
