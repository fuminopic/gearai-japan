export function calculateSavingsJpy(
  msrpJpy: number | null | undefined,
  purchasePriceJpy: number | null | undefined
) {
  if (msrpJpy === null || msrpJpy === undefined) {
    return null;
  }

  if (purchasePriceJpy === null || purchasePriceJpy === undefined) {
    return null;
  }

  return Number(msrpJpy) - Number(purchasePriceJpy);
}

export function parsePositiveNumber(value: string) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
