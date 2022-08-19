export type BoardCells = {
  [key: string]: number;
};

export type Cell<T extends BoardCells> = T[keyof T];

export type Board<T extends BoardCells> = {
  cells: Cell<T>[][];
  width: number;
  height: number;
};

export function createBoard<T extends BoardCells>(
  cellTypes: T,
  options: { width: number; height: number; outline: Cell<T>; inside: Cell<T> }
): Board<T> {
  const { width, height } = options;
  if (width < 3 || height < 3) {
    // Minimum size for it to be interesting
    throw new Error("Board must have at least 3x3 cells");
  }

  const cells: Cell<T>[][] = [];
  for (let i = 0; i < height; i++) {
    const row: Cell<T>[] = [];
    for (let j = 0; j < width; j++) {
      if (i <= 0 || j <= 0 || i >= height - 1 || j >= width - 1) {
        row.push(options.outline);
      } else {
        row.push(options.inside);
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

export function copyBoard<T extends BoardCells>(board: Board<T>): Board<T> {
  return {
    width: board.width,
    height: board.height,
    cells: board.cells.map((row) => row.slice()),
  };
}
export function copyBoardTo<T extends BoardCells>(
  board: Board<T>,
  target: Board<T>
) {
  for (let i = 0; i < board.cells.length; i++) {
    for (let j = 0; j < board.cells[i].length; j++) {
      target.cells[i][j] = board.cells[i][j];
    }
  }
}
