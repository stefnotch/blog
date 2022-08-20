import {
  createBoard,
  Board as GenericBoard,
  Cell,
  copyBoard,
} from "../Puzzles/board";
import { DisjointSet } from "./disjoint-set";

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
): FullMap<Direction, Cell<typeof Cells>> {
  return fullMap([
    [Directions.Up, getCellOrNull(board, x, y - 1) ?? Cells.Wall],
    [Directions.Right, getCellOrNull(board, x + 1, y) ?? Cells.Wall],
    [Directions.Down, getCellOrNull(board, x, y + 1) ?? Cells.Wall],
    [Directions.Left, getCellOrNull(board, x - 1, y) ?? Cells.Wall],
  ]);
}

type FullMap<K, V> = {
  get(key: K): V;
  set(key: K, value: V): void;
  [Symbol.iterator](): IterableIterator<[K, V]>;
};
function fullMap<K, V>(entries: (readonly [K, V])[]): FullMap<K, V> {
  return new Map<K, V>(entries) as FullMap<K, V>;
}

const CellPatterns = {
  MustHave: 0,
  MustNotHave: 1,
  Optional: 2,
};
type CellPattern = typeof CellPatterns[keyof typeof CellPatterns];

function matchesPattern(
  cell: Cell<typeof Cells>,
  pattern: FullMap<Direction, CellPattern>
) {
  const cellDirections = cellToDirection(cell);
  const allDirections = [
    Directions.Up,
    Directions.Right,
    Directions.Down,
    Directions.Left,
  ];
  return allDirections.every((direction) => {
    if (pattern.get(direction) === CellPatterns.Optional) {
      return true;
    } else {
      const hasDirection = cellDirections.includes(direction);
      return (
        (pattern.get(direction) === CellPatterns.MustHave) === hasDirection
      );
    }
  });
}

function mapValues<K, V, U>(
  map: FullMap<K, V>,
  fn: (key: K, value: V) => U
): FullMap<K, U> {
  const result = new Map<K, U>();
  for (const [key, value] of map) {
    result.set(key, fn(key, value));
  }
  return result as FullMap<K, U>;
}

function getValidPattern(
  board: Board,
  x: number,
  y: number
): FullMap<Direction, CellPattern> {
  return mapValues(neighborsAt(board, x, y), (direction, neighbor) =>
    neighbor === Cells.Empty
      ? CellPatterns.Optional
      : cellToDirection(neighbor).includes(oppositeDirection(direction))
      ? CellPatterns.MustHave
      : CellPatterns.MustNotHave
  );
}

function validCellsAt(
  board: Board,
  x: number,
  y: number
): Cell<typeof Cells>[] {
  const cell = board.cells[y][x];
  if (cell === Cells.Empty) {
    const allowedCellPattern = getValidPattern(board, x, y);
    const possibleCells = [
      Cells.TopLeft,
      Cells.LeftBottom,
      Cells.BottomRight,
      Cells.RightTop,
      Cells.TopBottom,
      Cells.LeftRight,
      Cells.All,
    ];
    return possibleCells.filter((v) => matchesPattern(v, allowedCellPattern));
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
  if (!isValid(startingBoard)) {
    return;
  }
  const queue = [startingBoard];

  if (isFull(startingBoard)) {
    yield startingBoard;
    return;
  }

  console.log("Getting solution...");

  while (true) {
    const board = queue.pop();
    if (board === undefined) {
      return;
    }
    const step = nextBestStep(board);

    for (const v of step.possibleCells) {
      const newBoard = copyBoard(board);
      newBoard.cells[step.y][step.x] = v;
      const numberOfClosedLoops = countClosedLoops(newBoard);
      if (numberOfClosedLoops >= 1) {
        if (isFull(newBoard)) {
          yield newBoard;
        } else {
          // Reject the board
        }
      } else {
        queue.push(newBoard);
      }
    }
  }
}

/**
 * Takes a valid board, and returns the number of actually closed loops.
 */
function countClosedLoops(board: Board) {
  return 0;
  /*type Discriminator = number;
  type Coordinate = readonly [number, number, Discriminator];
  const coordinates = board.cells.flatMap((row, y) =>
    row.flatMap(
      (cell, x) =>
        (cell === Cells.All
          ? ([
              [x, y, 0],
              [x, y, 1],
            ] as const)
          : ([[x, y, 0]] as const)) as readonly Coordinate[]
    )
  );
  const loops = new DisjointSet<Coordinate>();
  const disconnected: Coordinate = [-Infinity, -Infinity, 0];
  loops.makeSet(disconnected);
  coordinates.forEach((v) => loops.makeSet(v));

  coordinates.forEach((v) => {
    const [x, y] = v;
    const cell = board.cells[y][x];

    // Valid boards have the cute guarantee that adjacent cells are connected
    // The Cells.All cell is a special case, because it's two overlapping loops
    // We got the discriminator for that
    if (cell === Cells.Empty || cell === Cells.Wall) {
      loops.union(v, disconnected);
    } else if (cell === Cells.All) {
    }
  });

  return loops.size; // TODO: Implement*/
}

function isFull(board: Board): boolean {
  return board.cells.every((row) => row.every((cell) => cell !== Cells.Empty));
}

function isValid(board: Board) {
  for (let y = 0; y < board.height; y++) {
    for (let x = 0; x < board.width; x++) {
      if (board.cells[y][x] === Cells.Empty) {
        continue;
      }
      const validPattern = getValidPattern(board, x, y);
      if (!matchesPattern(board.cells[y][x], validPattern)) {
        return false;
      }
    }
  }

  return true;
}
