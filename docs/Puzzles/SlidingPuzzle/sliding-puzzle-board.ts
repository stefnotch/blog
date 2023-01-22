import { createBoard, Board as GenericBoard } from "../board";

export const Cells = {
  Empty: 0,
  Stone: 1,
  Goal: 2,
};

export function createBoardWithSize(size: { width: number; height: number }) {
  return createBoard(Cells, {
    width: size.width,
    height: size.height,
    outline: Cells.Stone,
    inside: Cells.Empty,
  });
}

export type Board = GenericBoard<typeof Cells>;
