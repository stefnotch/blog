<script setup lang="ts">
import {
  createBoardWithSize,
  Board,
  getSolutions,
  Cells,
  getCellFromDirections,
  narrowBoard,
} from "./ninety-degrees-puzzle";
import { ref, unref, watch } from "vue";
import { Cell } from "../Puzzles/board";
import { BaseDirection, Directions } from "../Puzzles/directions";

const boardSize = ref({
  width: 10,
  height: 10,
});
const board = ref(createBoardWithSize(boardSize.value));

const showSolutions = ref(
  new URL(window.location.href).searchParams.get("showSolutions") !== "false"
);

watch(
  boardSize,
  (newSize) => {
    board.value = createBoardWithSize(newSize);
  },
  { deep: true, flush: "sync" }
);

(() => {
  const url = new URL(window.location.href);
  const boardString = url.searchParams.get("board");
  if (boardString) {
    try {
      const parsedBoard = JSON.parse(boardString);
      boardSize.value = {
        width: parsedBoard.width,
        height: parsedBoard.height,
      };
      board.value = parsedBoard;
    } catch (error) {
      console.error(error);
    }
  }
})();

const solutions = ref<Board[]>([]);
watch(
  board,
  async (board) => {
    solutions.value = await getMaxNSolutions(unref(board), 4);
  },
  { deep: true }
);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// TODO: Async functions like this aren't very cancelable at all
async function getMaxNSolutions(
  startingBoard: Board,
  count: number
): Promise<Board[]> {
  await sleep(0);
  const result: Board[] = [];
  for (const solution of getSolutions(startingBoard)) {
    result.push(solution);
    if (result.length >= count) break;
    await sleep(0);
  }
  return result;
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
  } else if (cell === Cells.Wall) {
    return "cell-wall";
  }
  return "";
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

function shareBoard() {
  const url = new URL(window.location.href);
  // Maybe npm install jsoncrush
  url.searchParams.set("board", JSON.stringify(board.value));
  navigator.clipboard.writeText(url + "").then(
    () => {
      console.log("copied");
    },
    () => {
      console.log("copying failed");
    }
  );
}

const currentDrawing = ref<{
  x: number;
  y: number;
  direction: BaseDirection;
  originalCell: Cell<typeof Cells>;
} | null>(null);

function displayDrawingClass(direction: BaseDirection) {
  if (direction === Directions.Up) {
    return "drawing-up";
  } else if (direction === Directions.Down) {
    return "drawing-down";
  } else if (direction === Directions.Left) {
    return "drawing-left";
  } else if (direction === Directions.Right) {
    return "drawing-right";
  }
}

function normalizedCoords(ev: PointerEvent, target: Element) {
  const bounds = target.getBoundingClientRect();
  const x = (ev.clientX - bounds.left) / bounds.width;
  const y = (ev.clientY - bounds.top) / bounds.height;
  return { x, y };
}

function getDirection(coords: { x: number; y: number }) {
  // (pointer.x - center.x) - (point.y - center.y) > 0
  const diagonalA = coords.x - 0.5 - (coords.y - 0.5) > 0;
  // (pointer.x - center.x) + (point.y - center.y) > 0
  const diagonalB = coords.x - 0.5 + (coords.y - 0.5) > 0;
  if (diagonalA && !diagonalB) {
    return Directions.Up;
  } else if (diagonalA && diagonalB) {
    return Directions.Right;
  } else if (!diagonalA && diagonalB) {
    return Directions.Down;
  } else {
    return Directions.Left;
  }
}

function getParentWithClass(element: Element | null, className: string) {
  let current = element;
  while (current) {
    if (current.classList.contains(className)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getDirectionAndCell(ev: PointerEvent) {
  const target = getParentWithClass(
    document.elementFromPoint(ev.clientX, ev.clientY),
    "cell"
  );
  if (!target) return;
  const coords = normalizedCoords(ev, target);
  const direction = getDirection(coords);
  const cellCoords = {
    x: +(target.getAttribute("data-cell-x") ?? 0),
    y: +(target.getAttribute("data-cell-y") ?? 0),
  };

  return {
    direction,
    coords: cellCoords,
  };
}

function onPointerDown(ev: PointerEvent) {
  (ev.currentTarget as HTMLElement).setPointerCapture(ev.pointerId);

  if (ev.buttons === 2) {
    const v = getDirectionAndCell(ev);
    if (!v) return;
    const { coords } = v;
    board.value.cells[coords.y][coords.x] = Cells.Empty;
  }

  // The primary button needs to be pressed
  if (ev.buttons !== 1) return;

  const v = getDirectionAndCell(ev);
  if (!v) return;
  const { direction, coords } = v;

  currentDrawing.value = {
    x: coords.x,
    y: coords.y,
    direction,
    originalCell: board.value.cells[coords.y][coords.x],
  };
}
function onPointerMove(ev: PointerEvent) {
  // The primary button needs to be pressed
  if (ev.buttons !== 1) return;

  const current = currentDrawing.value;
  if (!current) return;

  const v = getDirectionAndCell(ev);
  if (!v) return;
  const { direction, coords } = v;

  const isNewCell = coords.x !== current.x || coords.y !== current.y;
  if (isNewCell) {
    currentDrawing.value = {
      x: coords.x,
      y: coords.y,
      direction,
      originalCell: board.value.cells[coords.y][coords.x],
    };
  } else {
    let newCell = getCellFromDirections(current.direction, direction);
    if (current.originalCell == Cells.TopBottom && newCell == Cells.LeftRight) {
      newCell = Cells.All;
    } else if (
      current.originalCell == Cells.LeftRight &&
      newCell == Cells.TopBottom
    ) {
      newCell = Cells.All;
    }
    board.value.cells[coords.y][coords.x] = newCell;
  }
}
function onPointerUp(ev: PointerEvent) {
  currentDrawing.value = null;
  (ev.currentTarget as HTMLElement).releasePointerCapture(ev.pointerId);
}

function narrowSolution() {
  board.value = narrowBoard(board.value);
}
</script>
<template>
  <div>
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
  </div>
  <table
    :tabIndex="0"
    className="game-table"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @contextmenu.prevent
  >
    <tbody>
      <tr v-for="(row, y) in board.cells">
        <!--@click="(ev) => handleClick(ev, x, y)"-->
        <td
          v-for="(cell, x) in row"
          class="cell"
          :data-cell-x="x"
          :data-cell-y="y"
        >
          <div class="game-table-cell" :class="displayCellClass(cell)"></div>
          <div
            class="game-table-cell-drawing"
            v-if="currentDrawing?.x === x && currentDrawing?.y === y"
            :class="displayDrawingClass(currentDrawing.direction)"
          ></div>
        </td>
      </tr>
    </tbody>
  </table>
  <div>
    <button @click="shareBoard">Copy</button>
  </div>
  <h2>Solutions <input type="checkbox" v-model="showSolutions" /></h2>
  <div class="solutions-container" v-if="showSolutions">
    <div>
      <button @click="narrowSolution">Add random tile from solution</button>
    </div>

    <table
      v-for="(board, index) in solutions"
      :key="index"
      :tabIndex="0"
      className="game-table"
    >
      <tbody>
        <tr v-for="(row, y) in board.cells">
          <td v-for="(cell, x) in row">
            <div class="game-table-cell" :class="displayCellClass(cell)"></div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.solutions-container {
  min-height: 100vh;
}
table.game-table {
  display: table;
  table-layout: fixed;
  overflow: auto;
  overflow-x: auto;
  overflow-y: auto;
}
.game-table:focus > tbody {
  outline: 1px solid #000;
}
.cell > * {
  pointer-events: none;
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
.game-table-cell-drawing {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.drawing-up {
  box-shadow: inset 0 2px 2px #00000088;
}
.drawing-down {
  box-shadow: inset 0 -2px 2px #00000088;
}
.drawing-left {
  box-shadow: inset 2px 0 2px #00000088;
}
.drawing-right {
  box-shadow: inset -2px 0 2px #00000088;
}

/* Straight paths */
.cell-empty,
.cell-top-bottom,
.cell-left-right,
.cell-all {
  border-radius: 0;
}

.cell-wall {
  background: #000;
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
