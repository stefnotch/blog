const DirectionSymbol = Symbol();
function brandDirection<T extends number | Direction>(
  value: T
): Direction<UnwrapDirection<T>> {
  return value as any;
}

/**
 * Bit-flag directions.
 * Intermediate directions can be represented using the OR operator.
 */
export const Directions = {
  Up: brandDirection(0b1),
  Right: brandDirection(0b10),
  Down: brandDirection(0b100),
  Left: brandDirection(0b1000),
};
export type BaseDirection = typeof Directions[keyof typeof Directions];
export type Direction<T extends number = number> = T & {
  [DirectionSymbol]: true;
};

type UnwrapDirection<T extends number | Direction> = T extends Direction<
  infer U
>
  ? U
  : T;

export function fromDirections(...directions: Direction[]): Direction {
  const n = directions.reduce((acc, direction) => acc | direction, 0);
  return brandDirection(n);
}

export function hasDirection(
  direction: Direction,
  baseDirection: BaseDirection
): boolean {
  return (direction & baseDirection) !== 0;
}

export function removeDirection(
  direction: Direction,
  baseDirection: BaseDirection
): Direction {
  return brandDirection(direction & ~baseDirection);
}
