// Credits to Wikipedia https://en.wikipedia.org/wiki/Disjoint-set_data_structure

class DisjointSetItem<T> {
  value: T;
  parent: DisjointSetItem<T>;
  size: number;
  constructor(value: T) {
    this.value = value;
    this.parent = this;
    this.size = 1;
  }
}
export class DisjointSet<T> {
  items = new Map<T, DisjointSetItem<T>>();
  size = 0;
  constructor() {}

  makeSet(value: T) {
    if (this.items.has(value)) return;
    this.items.set(value, new DisjointSetItem(value));
    this.size += 1;
  }

  findItem(value: T): DisjointSetItem<T> {
    let item = this.items.get(value);
    if (!item) throw new Error(`${value} not found`);

    // Also rewrite the parent links while walking up (efficiency)
    while (item.parent !== item) {
      item.parent = item.parent.parent;
      item = item.parent;
    }
    return item;
  }

  find(value: T): T {
    return this.findItem(value).value;
  }

  union(a: T, b: T) {
    // Get their roots
    let itemA = this.findItem(a);
    let itemB = this.findItem(b);

    // Same set
    if (itemA.value === itemB.value) return;

    if (itemA.size < itemB.size) {
      const temp = itemA;
      itemA = itemB;
      itemB = temp;
    }

    itemB.parent = itemA;
    itemA.size += itemB.size;

    this.size -= 1;
  }
}
