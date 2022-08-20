import {
  createBoard,
  Board as GenericBoard,
  Cell,
  copyBoard,
} from "../Puzzles/board";

export const Cells = {
  Empty: 0,
  TopLeft: 1,
  LeftBottom: 2,
  BottomRight: 3,
  RightTop: 4,
  TopBottom: 5,
  LeftRight: 6,
  All: 7,
  Wall: 8,
} as const;

const Directions = {
  Up: 0,
  Right: 1,
  Down: 2,
  Left: 3,
} as const;
type Direction = typeof Directions[keyof typeof Directions];

export function createBoardWithSize(size: { width: number; height: number }) {
  return createBoard(Cells, {
    width: size.width,
    height: size.height,
    outline: Cells.Empty,
    inside: Cells.Empty,
  });
}

export type Board = GenericBoard<typeof Cells>;

function cellToDirection(cell: Cell<typeof Cells>): Direction[] {
  switch (cell) {
    case Cells.TopLeft:
      return [Directions.Up, Directions.Left];
    case Cells.LeftBottom:
      return [Directions.Down, Directions.Left];
    case Cells.BottomRight:
      return [Directions.Down, Directions.Right];
    case Cells.RightTop:
      return [Directions.Up, Directions.Right];
    case Cells.TopBottom:
      return [Directions.Up, Directions.Down];
    case Cells.LeftRight:
      return [Directions.Left, Directions.Right];
    case Cells.All:
      return [
        Directions.Up,
        Directions.Left,
        Directions.Down,
        Directions.Right,
      ];
    case Cells.Empty:
      return [];
    case Cells.Wall:
      return [];
    default:
      throw new Error("Unknown cell " + cell);
  }
}

function oppositeDirection(direction: Direction): Direction {
  switch (direction) {
    case Directions.Up:
      return Directions.Down;
    case Directions.Right:
      return Directions.Left;
    case Directions.Down:
      return Directions.Up;
    case Directions.Left:
      return Directions.Right;
    default:
      throw new Error("Unknown direction " + direction);
  }
}

function getCellOrNull(board: Board, x: number, y: number) {
  if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
    return null;
  }
  return board.cells[y][x];
}

function neighborsAt(
  board: Board,
  x: number,
  y: number
): { [key in Direction]: Cell<typeof Cells> } {
  return {
    [Directions.Up]: getCellOrNull(board, x, y - 1) ?? Cells.Wall,
    [Directions.Right]: getCellOrNull(board, x + 1, y) ?? Cells.Wall,
    [Directions.Down]: getCellOrNull(board, x, y + 1) ?? Cells.Wall,
    [Directions.Left]: getCellOrNull(board, x - 1, y) ?? Cells.Wall,
  };
}

function mapValues<T extends Record<any, any>, U>(
  obj: T,
  fn: (v: keyof T) => U
): { [key in keyof T]: U } {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, fn(v)])
  ) as any;
}

function validCellsAt(
  board: Board,
  x: number,
  y: number
): Cell<typeof Cells>[] {
  const cell = board.cells[y][x];
  if (cell === Cells.Empty) {
    const neighbors = mapValues(neighborsAt(board, x, y), (v) =>
      // Pretend that empty cells allow all directions (for the purposes of being a neighbor)
      cellToDirection(v === Cells.Empty ? Cells.All : v)
    );
    const possibleCells = [
      Cells.TopLeft,
      Cells.LeftBottom,
      Cells.BottomRight,
      Cells.RightTop,
      Cells.TopBottom,
      Cells.LeftRight,
      Cells.All,
    ];
    return possibleCells.filter((v) => {
      const cellDirections = cellToDirection(v);
      return cellDirections.every((direction) =>
        neighbors[direction].includes(oppositeDirection(direction))
      );
    });
  } else {
    return [];
  }
}

// Incremental computation would be awesome
// Having a 2D array of cells
// => Getting a 2D array of valid cells (aka if the above was an empty cell, which cell could I place here)
// Then changing the 2D array of cells
// => And only the relevant bits of the 2D array of valid cells would be updated

function nextBestStep(board: Board): {
  x: number;
  y: number;
  possibleCells: Cell<typeof Cells>[];
} {
  const nextCells = {
    score: Infinity,
    x: 0,
    y: 0,
    possibleCells: [] as Cell<typeof Cells>[],
  };
  // Pick a nice tile, generate all possibilities and either return them or put them in the queue
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      const possibleCells = validCellsAt(board, x, y);
      if (possibleCells.length == 0) continue;
      if (possibleCells.length == 1) {
        return {
          x,
          y,
          possibleCells,
        };
      } else if (possibleCells.length < nextCells.score) {
        nextCells.score = possibleCells.length;
        nextCells.x = x;
        nextCells.y = y;
        nextCells.possibleCells = possibleCells;
      }
    }
  }
  return nextCells;
}

/**
 * Takes a valid board, and returns valid board solutions
 */
export function* getSolutions(startingBoard: Board) {
  const queue = [startingBoard];

  if (isFull(startingBoard)) {
    yield startingBoard;
    return;
  }

  console.log("start");

  while (true) {
    const board = queue.pop();
    if (board === undefined) {
      return;
    }
    const step = nextBestStep(board);

    for (const v of step.possibleCells) {
      const newBoard = copyBoard(board);
      newBoard.cells[step.y][step.x] = v;
      if (isFull(newBoard)) {
        yield newBoard;
      } else {
        queue.push(newBoard);
      }
    }
  }
}

function isFull(board: Board): boolean {
  return board.cells.every((row) => row.every((cell) => cell !== Cells.Empty));
}
