<script setup lang="ts">
import { ref } from "vue";
import {
  createBoard,
  Board as GenericBoard,
  Cell,
  copyBoard,
} from "../Puzzles/board";

const Cells = {
  Empty: 0,
  TopLeft: 1,
  LeftBottom: 2,
  BottomRight: 3,
  RightTop: 4,
  TopBottom: 5,
  LeftRight: 6,
  All: 7,
} as const;

const Directions = {
  Up: 0,
  Right: 1,
  Down: 2,
  Left: 3,
} as const;
type Direction = typeof Directions[keyof typeof Directions];

function createBoardWithSize(size: { width: number; height: number }) {
  return createBoard(Cells, {
    width: size.width,
    height: size.height,
    outline: Cells.Empty,
    inside: Cells.Empty,
  });
}

type Board = GenericBoard<typeof Cells>;

const boardSize = ref({
  width: 10,
  height: 10,
});
const board = ref(createBoardWithSize(boardSize.value));

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
    [Directions.Up]: getCellOrNull(board, x, y - 1) ?? Cells.Empty,
    [Directions.Right]: getCellOrNull(board, x + 1, y) ?? Cells.Empty,
    [Directions.Down]: getCellOrNull(board, x, y + 1) ?? Cells.Empty,
    [Directions.Left]: getCellOrNull(board, x - 1, y) ?? Cells.Empty,
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
      cellToDirection(v)
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

function displayCellClass(cell: Cell<typeof Cells>): string {
  if (cell === Cells.Empty) {
    return "cell-empty";
  } else if (cell === Cells.TopLeft) {
    return "cell-top-left";
  } else if (cell === Cells.LeftBottom) {
    return "cell-left-bottom";
  } else if (cell === Cells.BottomRight) {
    return "cell-bottom-right";
  } else if (cell === Cells.RightTop) {
    return "cell-right-top";
  } else if (cell === Cells.TopBottom) {
    return "cell-top-bottom";
  } else if (cell === Cells.LeftRight) {
    return "cell-left-right";
  } else if (cell === Cells.All) {
    return "cell-all";
  }
  return "";
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
function* getSolutions(startingBoard: Board) {
  const queue = [startingBoard];

  if (isFull(startingBoard)) {
    yield startingBoard;
    return;
  }

  while (true) {
    const board = queue.pop();
    if (board === undefined) {
      return;
    }
    const step = nextBestStep(board);
    step.possibleCells.forEach((v) => {
      const newBoard = copyBoard(board);
      newBoard.cells[step.y][step.x] = v;
      if (isFull(newBoard)) {
        yield newBoard;
      } else {
        queue.push(newBoard);
      }
    });
  }
}

function isFull(board: Board): boolean {
  return board.cells.every((row) => row.every((cell) => cell !== Cells.Empty));
}

function handleClick(event: MouseEvent, x: number, y: number) {
  board.value.cells[y][x] = cycleCell(board.value.cells[y][x]);
}

function cycleCell(cell: Cell<typeof Cells>): Cell<typeof Cells> {
  if (cell === Cells.Empty) {
    return Cells.TopLeft;
  } else if (cell === Cells.TopLeft) {
    return Cells.LeftBottom;
  } else if (cell === Cells.LeftBottom) {
    return Cells.BottomRight;
  } else if (cell === Cells.BottomRight) {
    return Cells.RightTop;
  } else if (cell === Cells.RightTop) {
    return Cells.TopBottom;
  } else if (cell === Cells.TopBottom) {
    return Cells.LeftRight;
  } else if (cell === Cells.LeftRight) {
    return Cells.All;
  } else if (cell === Cells.All) {
    return Cells.Empty;
  }
  return cell;
}
</script>
<template>
  <div>
    <!--
    Playing field size
    <input
      type="number"
      min="3"
      max="999"
      :size="3"
      v-model="boardSize.width"
    />
    x
    <input
      type="number"
      min="3"
      max="999"
      :size="3"
      v-model="boardSize.height"
    />
    -->
  </div>
  <table :tabIndex="0" className="game-table">
    <tbody>
      <tr v-for="(row, y) in board.cells">
        <td v-for="(cell, x) in row" @click="(ev) => handleClick(ev, x, y)">
          <div class="game-table-cell" :class="displayCellClass(cell)"></div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.game-table {
  table-layout: fixed;
}
.game-table:focus > tbody {
  outline: 1px solid #000;
}
.game-table tr {
  padding: 0px;
  margin: 0px;
}
.game-table td {
  position: relative;
  user-select: none;
  line-height: 0px;
  width: 2rem;
  height: 2rem;
  padding: 0px;
  margin: 0px;
}
.game-table-cell {
  --line-thickness: 4px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: var(--line-thickness) solid #000;
  box-sizing: border-box;
  overflow: hidden;
}

/* Straight paths */
.cell-empty,
.cell-top-bottom,
.cell-left-right,
.cell-all {
  border-radius: 0;
}

.game-table-cell.cell-empty {
  display: none;
}

.game-table-cell.cell-top-bottom {
  left: 50%;
  border-top-width: 0;
  border-right-width: 0;
  border-bottom-width: 0;
  transform: translate(calc(-1 * var(--line-thickness) / 2), 0);
}
.game-table-cell.cell-left-right {
  top: 50%;
  border-left-width: 0;
  border-right-width: 0;
  border-bottom-width: 0;
  transform: translate(0, calc(-1 * var(--line-thickness) / 2));
}

.game-table-cell.cell-all {
  /*display: none;*/
  border-width: 0;
}
.game-table-cell.cell-all::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: var(--line-thickness);
  background: black;
  transform: translate(0, calc(-1 * var(--line-thickness) / 2));
}

.game-table-cell.cell-all::after {
  content: "";
  position: absolute;
  top: 0;
  left: 50%;
  bottom: 0;
  width: var(--line-thickness);
  background: black;
  transform: translate(calc(-1 * var(--line-thickness) / 2), 0);
  box-shadow: -4px 0px 0 #fff, 4px 0px 0 #fff;
}

/* Curved paths */
.cell-top-left,
.cell-left-bottom,
.cell-bottom-right,
.cell-right-top {
  width: calc(100% + var(--line-thickness));
  height: calc(100% + var(--line-thickness));
  transform: translate(
    calc(-1 * var(--line-thickness) / 2),
    calc(-1 * var(--line-thickness) / 2)
  );
  border-radius: 100%;
}

.game-table-cell.cell-top-left {
  left: -50%;
  top: -50%;
  clip-path: polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%);
}
.game-table-cell.cell-left-bottom {
  left: -50%;
  top: 50%;
  clip-path: polygon(50% 0, 100% 0, 100% 50%, 50% 50%);
}
.game-table-cell.cell-bottom-right {
  left: 50%;
  top: 50%;
  clip-path: polygon(0 0, 50% 0, 50% 50%, 0 50%);
}
.game-table-cell.cell-right-top {
  left: 50%;
  top: -50%;
  clip-path: polygon(0 50%, 50% 50%, 50% 100%, 0 100%);
}
.game-table td:hover {
  cursor: pointer;
  outline: 1px solid #000;
}
</style>
