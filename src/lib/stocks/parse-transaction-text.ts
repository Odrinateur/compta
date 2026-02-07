type ParsedStockTransaction = {
    etfName: string;
    side: "buy" | "sell";
    date: Date;
    quantity: number;
    price: number;
    operationFee: number;
};

type EtfCandidate = {
    id: number;
    name?: string | null;
    yahooName?: string | null;
};

const normalizeNumber = (value: string): number | null => {
    const cleaned = value.replace(/\s+/g, "").replace(",", ".");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseDate = (value: string): Date | null => {
    const [day, month, yearRaw] = value.split("/");
    if (!day || !month || !yearRaw) return null;
    const year =
        yearRaw.length === 2 ? 2000 + Number(yearRaw) : Number(yearRaw);
    const parsedDay = Number(day);
    const parsedMonth = Number(month);
    if (!Number.isFinite(year) || !Number.isFinite(parsedDay)) return null;
    if (!Number.isFinite(parsedMonth)) return null;
    return new Date(year, parsedMonth - 1, parsedDay);
};

const normalizeEtfName = (value: string): string => {
    return value
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .replace(/&/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const scoreEtfMatch = (fromText: string, candidate: string): number => {
    if (!fromText || !candidate) return 0;
    if (fromText === candidate) return 1;
    if (fromText.includes(candidate) || candidate.includes(fromText)) {
        return 0.95;
    }

    const tokensA = new Set(fromText.split(" ").filter(Boolean));
    const tokensB = new Set(candidate.split(" ").filter(Boolean));
    const intersection = Array.from(tokensA).filter((token) =>
        tokensB.has(token)
    );
    const unionSize = new Set([...tokensA, ...tokensB]).size;
    if (unionSize === 0) return 0;
    return intersection.length / unionSize;
};

export const matchEtfName = (
    etfName: string,
    candidates: EtfCandidate[]
): EtfCandidate | null => {
    const normalizedTarget = normalizeEtfName(etfName);
    let best: { candidate: EtfCandidate; score: number } | null = null;

    for (const candidate of candidates) {
        const name = candidate.yahooName ?? candidate.name ?? "";
        if (!name) continue;
        const normalizedCandidate = normalizeEtfName(name);
        const score = scoreEtfMatch(normalizedTarget, normalizedCandidate);
        if (!best || score > best.score) {
            best = { candidate, score };
        }
    }

    if (!best || best.score < 0.35) return null;
    return best.candidate;
};

export const parseStockTransactionText = (
    input: string
): ParsedStockTransaction | null => {
    const normalized = input.replace(/\s+/g, " ").trim();
    const flattened = normalized
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");
    const regex =
        /ordre (d['']achat|de vente) sur (.+?) a ete execute a ([\d.,]+) EUR pour une quantite de ([\d.,]+) le (\d{2}\/\d{2}\/\d{2,4})/i;
    const match = flattened.match(regex);

    if (!match) return null;

    const side = match[1]?.toLowerCase().includes("vente") ? "sell" : "buy";
    const etfName = match[2]?.trim();
    const price = match[3] ? normalizeNumber(match[3]) : null;
    const quantity = match[4] ? normalizeNumber(match[4]) : null;
    const date = match[5] ? parseDate(match[5]) : null;

    if (!etfName || price === null || quantity === null || !date) return null;

    return { etfName, side, price, quantity, date, operationFee: 0 };
};
