export function includes<T extends U, U>(
  arr: ReadonlyArray<T>,
  searchElement: U,
): searchElement is T {
  return arr.includes(searchElement as T);
}
