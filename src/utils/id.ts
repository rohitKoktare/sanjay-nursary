let counter = 0;

export function uid(prefix = "id"): string {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function nextBatchNo(existing: string[]): string {
  const nums = existing
    .map((b) => Number(b.replace(/^B0*/, "")))
    .filter((n) => !Number.isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `B${String(next).padStart(3, "0")}`;
}
