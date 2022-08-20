<script setup lang="ts">
import {
  createBoardWithSize,
  Board,
  getSolutions,
  Cells,
} from "./ninety-degrees-puzzle";
import { ref, unref, watch } from "vue";
import { Cell } from "../Puzzles/board";

const boardSize = ref({
  width: 10,
  height: 10,
});
const board = ref(createBoardWithSize(boardSize.value));

watch(
  boardSize,
  (newSize) => {
    board.value = createBoardWithSize(newSize);
  },
  { deep: true }
);

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
  <table :tabIndex="0" className="game-table">
    <tbody>
      <tr v-for="(row, y) in board.cells">
        <td v-for="(cell, x) in row" @click="(ev) => handleClick(ev, x, y)">
          <div class="game-table-cell" :class="displayCellClass(cell)"></div>
        </td>
      </tr>
    </tbody>
  </table>
  <h2>Solutions</h2>
  (Single loop rule not checked yet)

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
</template>

<style scoped>
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
