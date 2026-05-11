export function fibonacciIntervalSeconds(index: number): number {
  if (index <= 1) return 60;
  let prev = 60;
  let curr = 60;
  for (let i = 2; i <= index; i += 1) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}
