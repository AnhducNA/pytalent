export function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function arraysEqualWithoutLength(a: any[], b: any[]) {
  if (a == null || b == null) return false;
  if (a.length <= b.length) {
    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
  } else {
    for (let i = 0; i < b.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
  }
  return true;
}
