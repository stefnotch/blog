import { ref } from "vue";
import { Position } from "./position";
import { Board, Cells } from "./sliding-puzzle-board";

export function usePlayer() {
  const position = ref<Position>({ x: 0, y: 0 });

  function placeOnBoard(board: Board) {
    const { width, height } = board;

    position.value = {
      x: width - 2,
      y: height - 1,
    };
    board.cells[position.value.y][position.value.x] = Cells.Empty;
  }

  return {
    position,
    placeOnBoard,
  };
}
