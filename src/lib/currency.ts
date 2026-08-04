const formatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export function formatNaira(amount: number | string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return formatter.format(Number.isFinite(value) ? value : 0);
}
