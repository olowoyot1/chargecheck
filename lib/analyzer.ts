export type Transaction = {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  reference?: string;
  currency: string;
  flags: string[];
};

const normalise = (value: unknown) => String(value ?? "").trim();
const amount = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? Math.abs(value) : 0;
  const cleaned = normalise(value).replace(/[₦$£€,\s]/g, "").replace(/\((.*)\)/, "-$1");
  const parsed = Number(cleaned.replace(/,/g, ""));
  return Number.isFinite(parsed) ? Math.abs(parsed) : 0;
};

function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  const keys = Object.keys(row);
  const found = keys.find(key => candidates.includes(key.toLowerCase().replace(/[^a-z]/g, "")));
  return found ? row[found] : "";
}

export function analyseRows(rows: Record<string, unknown>[]): Transaction[] {
  const parsed = rows.map((row, index) => {
    const rawDate = pick(row, ["date", "transactiondate", "valuedate", "postingdate"]);
    const date = rawDate instanceof Date ? rawDate.toISOString().slice(0, 10) : normalise(rawDate);
    const description = normalise(pick(row, ["description", "narration", "details", "transactiondetails", "remark"]));
    const debit = amount(pick(row, ["debit", "withdrawal", "moneyout", "paidout"]));
    const credit = amount(pick(row, ["credit", "deposit", "moneyin", "paidin"]));
    const reference = normalise(pick(row, ["reference", "transactionid", "ref", "sessionid"]));
    return { id: String(index + 1), date, description, debit, credit, reference, currency: "NGN", flags: [] as string[] };
  }).filter(tx => tx.description || tx.debit || tx.credit);

  const seen = new Map<string, number>();
  for (const tx of parsed) {
    const key = [tx.date, tx.description.toLowerCase().replace(/\s+/g, " "), tx.debit.toFixed(2)].join("|");
    if (tx.debit > 0 && seen.has(key)) {
      tx.flags.push("Possible duplicate debit");
      parsed[seen.get(key)!].flags.push("Possible duplicate debit");
    } else if (tx.debit > 0) seen.set(key, Number(tx.id) - 1);

    const text = tx.description.toLowerCase();
    if (tx.debit > 0 && /(charge|fee|commission|vat|stamp duty|maintenance)/i.test(text)) {
      tx.flags.push("Bank fee or charge — review against your account terms");
    }
    if (tx.debit > 0 && /(reversal|reversed|refund|chargeback)/i.test(text)) {
      tx.flags.push("Debit description mentions a reversal/refund — verify the matching credit");
    }
  }

  const recurring = new Map<string, Transaction[]>();
  for (const tx of parsed) {
    if (!tx.debit) continue;
    const key = tx.description.toLowerCase().replace(/[0-9*#-]/g, "").replace(/\s+/g, " ").trim();
    if (key.length > 3) recurring.set(key, [...(recurring.get(key) ?? []), tx]);
  }
  for (const group of recurring.values()) {
    if (group.length >= 2) group.forEach(tx => tx.flags.push("Repeated merchant/description — check whether this is an expected recurring payment"));
  }
  return parsed;
}

export function rowsFromObjects(rows: unknown[]): Record<string, unknown>[] {
  return rows.filter((row): row is Record<string, unknown> => !!row && typeof row === "object" && !Array.isArray(row));
}