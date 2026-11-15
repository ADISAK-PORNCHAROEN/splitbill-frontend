export type Share = { member: string; satang: bigint };

export function allocateEqual(total: bigint, members: readonly string[]): Share[] {
  if (total <= BigInt(0) || members.length === 0 || members.some((member) => !member) || new Set(members).size !== members.length) {
    throw new Error("A positive amount and distinct members are required.");
  }

  const count = BigInt(members.length);
  const base = total / count;
  const remainder = total % count;
  return members.map((member, index) => ({
    member,
    satang: base + (BigInt(index) < remainder ? BigInt(1) : BigInt(0)),
  }));
}

export function validateExact(total: bigint, shares: readonly Share[]): boolean {
  return total > BigInt(0)
    && shares.length > 0
    && shares.every((share) => share.member.length > 0 && share.satang > BigInt(0))
    && new Set(shares.map((share) => share.member)).size === shares.length
    && shares.reduce((sum, share) => sum + share.satang, BigInt(0)) === total;
}
