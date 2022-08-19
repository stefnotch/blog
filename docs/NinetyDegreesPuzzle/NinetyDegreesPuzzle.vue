<script setup lang="ts">
import { ref } from "vue";
import { createBoard, Board as GenericBoard, Cell } from "../Puzzles/board";

const Cells = {
  Empty: 0,
  TopLeft: 1,
  LeftBottom: 2,
  BottomRight: 3,
  RightTop: 4,
};

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

function displayCellStyle(cell: Cell<typeof Cells>): string {
  if (cell === Cells.Empty) {
    return "display: none";
  } else if (cell === Cells.TopLeft) {
    return "left: -50%; top: -50%;  clip-path: polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%);";
  } else if (cell === Cells.LeftBottom) {
    return "left: -50%; top: 50%;  clip-path: polygon(50% 0, 100% 0, 100% 50%, 50% 50%);";
  } else if (cell === Cells.BottomRight) {
    return "left: 50%; top: 50%; clip-path: polygon(0 0, 50% 0, 50% 50%, 0 50%);";
  } else if (cell === Cells.RightTop) {
    return "left: 50%; top: -50%; clip-path: polygon(0 50%, 50% 50%, 50% 100%, 0 100%);";
  }
  return "?";
}

function handleClick(event: MouseEvent, y: number, x: number) {
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
        <td v-for="(cell, x) in row" @click="(ev) => handleClick(ev, y, x)">
          <div class="game-table-cell" :style="displayCellStyle(cell)"></div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style>
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
  width: calc(100% + var(--line-thickness));
  height: calc(100% + var(--line-thickness));
  border: var(--line-thickness) solid #000;
  transform: translate(
    calc(-1 * var(--line-thickness) / 2),
    calc(-1 * var(--line-thickness) / 2)
  );
  border-radius: 100%;
  box-sizing: border-box;
  overflow: hidden;
}
.game-table td:hover {
  cursor: pointer;
  outline: 1px solid #000;
}
</style>
