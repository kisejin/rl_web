export const WALLS = [7, 12];
export const GOAL = 4;
export const TRAP = 18;
export const START = 20;
export function move(state, action) {
  if (state === GOAL || state === TRAP) return state;
  const row = Math.floor(state / 5),
    col = state % 5;
  const [dr, dc] = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ][action];
  const nr = row + dr,
    nc = col + dc,
    next = nr * 5 + nc;
  return nr < 0 || nr >= 5 || nc < 0 || nc >= 5 || WALLS.includes(next)
    ? state
    : next;
}
export function solveGrid(gamma = 0.9, cost = -0.1) {
  let values = Array(25).fill(0);
  for (let k = 0; k < 220; k++) {
    values = values.map((_, s) => {
      if (WALLS.includes(s) || s === GOAL || s === TRAP) return 0;
      return Math.max(
        ...[0, 1, 2, 3].map((a) => {
          const next = move(s, a);
          return (
            (next === GOAL ? 10 : next === TRAP ? -5 : cost) +
            gamma * values[next]
          );
        }),
      );
    });
  }
  const policy = values.map((_, s) => {
    const qs = [0, 1, 2, 3].map((a) => {
      const next = move(s, a);
      return (
        (next === GOAL ? 10 : next === TRAP ? -5 : cost) + gamma * values[next]
      );
    });
    return qs.indexOf(Math.max(...qs));
  });
  return { values, policy };
}
export function rubricScore(scores, weights, gate = true) {
  const total = weights.reduce((a, b) => a + b, 0);
  return total > 0 && gate
    ? scores.reduce((a, s, i) => a + s * weights[i], 0) / total
    : 0;
}
export function closeEnough(a, b) {
  if (typeof a === "number" && typeof b === "number")
    return (
      Number.isFinite(a) && Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(b))
    );
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((v, i) => closeEnough(v, b[i]));
  return a === b;
}
