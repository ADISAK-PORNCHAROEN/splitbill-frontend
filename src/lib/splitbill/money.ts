const MAX_EXPENSE_SATANG = BigInt("999999999999");
const HUNDRED = BigInt(100);

export function parseMoney(input: string): bigint | null {
  if (input.length > 256 || !/^-?\d+(?:\.\d{1,2})?$/.test(input)) return null;

  const negative = input.startsWith("-");
  const [whole, fraction = ""] = (negative ? input.slice(1) : input).split(".");
  const satang = BigInt(whole) * HUNDRED + BigInt(fraction.padEnd(2, "0"));
  return negative ? -satang : satang;
}

export function parseExpenseMoney(input: string): bigint | null {
  const satang = parseMoney(input);
  return satang !== null && satang > BigInt(0) && satang <= MAX_EXPENSE_SATANG
    ? satang
    : null;
}

export function toDecimalString(satang: bigint): string {
  const negative = satang < BigInt(0);
  const absolute = negative ? -satang : satang;
  return `${negative ? "-" : ""}${absolute / HUNDRED}.${String(absolute % HUNDRED).padStart(2, "0")}`;
}

export function formatMoney(satang: bigint): string {
  const decimal = toDecimalString(satang);
  const [whole, fraction] = decimal.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`;
}
