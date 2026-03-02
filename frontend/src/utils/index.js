export function formatNumber(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString();
}
