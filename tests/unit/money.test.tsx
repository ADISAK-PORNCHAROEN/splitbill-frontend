import { describe, expect, it } from "vitest";
import { allocateEqual, validateExact } from "../../src/lib/splitbill/allocation";
import { formatMoney, parseExpenseMoney, parseMoney, toDecimalString } from "../../src/lib/splitbill/money";

describe("money", () => {
  it("parses decimal input to exact satang without floating-point errors", () => {
    expect(parseMoney("0.1")).toBe(BigInt(10));
    expect(parseMoney("0.2")).toBe(BigInt(20));
    expect(toDecimalString(BigInt(10) + BigInt(20))).toBe("0.30");
    expect(parseMoney("-333.33")).toBe(BigInt(-33333));
  });

  it("rejects invalid precision, format, nonpositive expense amounts and overflow", () => {
    for (const input of ["", "-1.00", "0", "10.005", "1,000.00", "1e3", "10000000000.00"]) {
      expect(parseExpenseMoney(input)).toBeNull();
    }
    expect(parseExpenseMoney("9999999999.99")).toBe(BigInt("999999999999"));
  });

  it("formats signed values and large aggregate balances without rounding", () => {
    expect(formatMoney(BigInt(100000))).toBe("1,000.00");
    expect(formatMoney(BigInt(-33333))).toBe("-333.33");
    expect(formatMoney(BigInt("900719925474099301"))).toBe("9,007,199,254,740,993.01");
    expect(toDecimalString(BigInt(5))).toBe("0.05");
  });
});

describe("expense allocation", () => {
  it("distributes the remainder one satang at a time in member order", () => {
    expect(allocateEqual(BigInt(10000), ["alice", "bob", "carol"])).toEqual([
      { member: "alice", satang: BigInt(3334) },
      { member: "bob", satang: BigInt(3333) },
      { member: "carol", satang: BigInt(3333) },
    ]);
    expect(allocateEqual(BigInt(1), ["carol", "alice", "bob"])).toEqual([
      { member: "carol", satang: BigInt(1) },
      { member: "alice", satang: BigInt(0) },
      { member: "bob", satang: BigInt(0) },
    ]);
  });

  it("rejects missing or duplicate equal participants", () => {
    expect(() => allocateEqual(BigInt(100), [])).toThrow();
    expect(() => allocateEqual(BigInt(100), ["alice", "alice"])).toThrow();
  });

  it("accepts only positive exact shares that add up to the expense", () => {
    expect(validateExact(BigInt(10000), [{ member: "alice", satang: BigInt(5000) }, { member: "bob", satang: BigInt(5000) }])).toBe(true);
    expect(validateExact(BigInt(10000), [{ member: "alice", satang: BigInt(9999) }])).toBe(false);
    expect(validateExact(BigInt(10000), [{ member: "alice", satang: BigInt(10000) }, { member: "bob", satang: BigInt(0) }])).toBe(false);
    expect(validateExact(BigInt(10000), [{ member: "alice", satang: BigInt(5000) }, { member: "alice", satang: BigInt(5000) }])).toBe(false);
    expect(validateExact(BigInt(0), [])).toBe(false);
  });
});
