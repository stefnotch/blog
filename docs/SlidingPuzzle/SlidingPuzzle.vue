<script setup lang="ts">
import { ref, computed, watch, type Ref, type ComputedRef } from "vue";
import { Position } from "./position";
import { Cells, createBoardWithSize, Board } from "./sliding-puzzle-board";
import { Cell, copyBoard, copyBoardTo, createBoard } from "../Puzzles/board";
import { usePlayer } from "./sliding-puzzle-player";

const boardSize = ref({
  width: 10,
  height: 10,
});
const board = ref(createBoardWithSize(boardSize.value));
const player = usePlayer();

const solution = ref<Position[]>([]);
player.placeOnBoard(board.value);
initializeBoard(board.value);

watch(
  boardSize,
  (newSize) => {
    board.value = createBoardWithSize(newSize);
    player.placeOnBoard(board.value);
    initializeBoard(board.value);
  },
  { deep: true }
);

async function initializeBoard(board: Board) {
  while (true) {
    const done = placeRocksAndGoal(board);
    if (done) break;

    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

function placeRocksAndGoal(board: Board): boolean {
  const { width, height } = board;

  let numberOfRocks = Math.floor((Math.random() * (width * height)) / 3);
  while (numberOfRocks > 0) {
    for (let trial = 0; trial < 2; trial++) {
      const copy = copyBoard(board);

      // Place the goal randomly
      const goalX = Math.floor(Math.random() * (width - 2)) + 1;
      const goalY = Math.floor(Math.random() * (height - 2)) + 1;
      copy.cells[goalY][goalX] = Cells.Goal;

      // Place rocks randomly
      for (let i = 0; i < numberOfRocks; i++) {
        const x = Math.floor(Math.random() * (width - 2)) + 1;
        const y = Math.floor(Math.random() * (height - 2)) + 1;
        if (copy.cells[y][x] === Cells.Empty) {
          copy.cells[y][x] = Cells.Stone;
        } else {
          // Sometimes give up and decide to not place a rock at all
          if (Math.random() > 0.5) i--;
        }
      }

      const solutionSteps = getSolution(copy);
      if (solutionSteps != null) {
        copyBoardTo(copy, board);
        solution.value = flattenSolution(solutionSteps);
        return true;
      }
    }

    numberOfRocks -= 1;
  }

  console.log("Oh no, it failed. Retrying...?");
  return false;
}

type SolutionStep = {
  position: Position;
  direction: Position;
  previous: SolutionStep | null;
};

function getSolution(board: Board): SolutionStep | null {
  const visited = new Set<string>();
  const addToVisited = (pos: Position) => {
    visited.add(`${pos.x},${pos.y}`);
  };
  const visitedContains = (pos: Position) => {
    return visited.has(`${pos.x},${pos.y}`);
  };

  const queue: SolutionStep[] = [];

  const possibleDirections = [
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: -1 },
    { x: 0, y: 1 },
  ];

  // Now insert the player's position
  addToVisited(player.position.value);
  possibleDirections.forEach((dir) => {
    queue.push({
      position: player.position.value,
      direction: dir,
      previous: null,
    });
  });

  while (queue.length > 0) {
    const step = queue.shift()!;
    const { position, direction } = step;

    const nextPosition = findWallInDirection(position, direction, board);

    if (board.cells[nextPosition.y][nextPosition.x] === Cells.Goal) {
      return {
        position: nextPosition,
        direction,
        previous: step,
      };
    }

    if (visitedContains(nextPosition)) {
      continue;
    }

    addToVisited(nextPosition);
    possibleDirections.forEach((dir) => {
      queue.push({
        position: nextPosition,
        direction: dir,
        previous: step,
      });
    });
  }

  return null;
}

function flattenSolution(solutionSteps: SolutionStep): Position[] {
  const result: Position[] = [];
  let v: SolutionStep | null = solutionSteps;
  while (v != null) {
    result.push(v.position);
    v = v.previous;
  }
  return result.reverse();
}

function findWallInDirection(
  start: Position,
  direction: Position,
  board: Board
): Position {
  const { width, height } = board;

  while (true) {
    const next: Position = {
      x: start.x + direction.x,
      y: start.y + direction.y,
    };

    if (next.x < 0 || next.x >= width || next.y < 0 || next.y >= height) {
      return start;
    }

    if (board.cells[next.y][next.x] === Cells.Stone) {
      return start;
    }

    start = next;
  }
}
function displayCell(cell: Cell<typeof Cells>): string {
  if (cell === Cells.Empty) {
    return " ";
  } else if (cell === Cells.Stone) {
    return "⛰";
  } else if (cell === Cells.Goal) {
    return "🐟";
  }
  return "?";
}

function handleInput(ev: KeyboardEvent) {
  if (ev.code == "ArrowUp") {
    console.log("up");
    player.position.value = findWallInDirection(
      player.position.value,
      { x: 0, y: -1 },
      board.value
    );
    ev.preventDefault();
  } else if (ev.code == "ArrowDown") {
    console.log("down");
    player.position.value = findWallInDirection(
      player.position.value,
      { x: 0, y: 1 },
      board.value
    );
    ev.preventDefault();
  } else if (ev.code == "ArrowLeft") {
    console.log("left");
    player.position.value = findWallInDirection(
      player.position.value,
      { x: -1, y: 0 },
      board.value
    );
    ev.preventDefault();
  } else if (ev.code == "ArrowRight") {
    console.log("right");
    player.position.value = findWallInDirection(
      player.position.value,
      { x: 1, y: 0 },
      board.value
    );
    ev.preventDefault();
  }
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
  <table :tabIndex="0" className="game-table" @keydown="handleInput($event)">
    <tbody>
      <tr v-for="(row, y) in board.cells">
        <td v-for="(cell, x) in row">
          <span>{{ displayCell(cell) }}</span>
          <span
            v-if="x == player.position.value.x && y == player.position.value.y"
            style="
              position: absolute;
              transform: translate(0%, -50%);
              text-align: center;
            "
            >🐈</span
          >
        </td>
      </tr>
    </tbody>
  </table>
  <div>
    <button @click="player.placeOnBoard(board)">Back to square 1</button>
  </div>
  Solution in an arcane language understood by computer-wizards:
  <pre>{{ solution }}</pre>
</template>

<style>
.game-table {
  table-layout: fixed;
}
.game-table:focus > tbody {
  outline: 1px solid #000;
}
.game-table::after {
  content: "<Paused - click to play>";
}

.game-table:focus::after {
  content: "Playing";
}
</style>
