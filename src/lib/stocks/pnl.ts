const DAY_MS = 86_400_000;

type Transaction = {
    date: string;
    side: "buy" | "sell";
    quantity: number;
    price: number;
    operationFee?: number | null;
};

type FeeState = {
    quantity: number;
    invested: number;
    realizedPnl: number;
    lastFeeTimestamp: number | null;
    lastPrice: number;
};

const applyAnnualFees = (
    invested: number,
    quantity: number,
    lastPrice: number,
    annualFeePercent: number,
    fromTimestamp: number | null,
    toTimestamp: number
): { invested: number; lastFeeTimestamp: number } => {
    if (fromTimestamp === null) {
        return { invested, lastFeeTimestamp: toTimestamp };
    }

    const daySpan = Math.max(
        0,
        Math.floor((toTimestamp - fromTimestamp) / DAY_MS)
    );
    if (daySpan === 0 || annualFeePercent <= 0) {
        return { invested, lastFeeTimestamp: toTimestamp };
    }

    const dailyRate = annualFeePercent / 100 / 365;
    if (dailyRate <= 0 || quantity <= 0 || lastPrice <= 0) {
        return { invested, lastFeeTimestamp: toTimestamp };
    }
    const feeBase = quantity * lastPrice;
    const feeAmount = feeBase * (1 - Math.pow(1 - dailyRate, daySpan));
    return {
        invested: Math.max(invested + feeAmount, 0),
        lastFeeTimestamp: toTimestamp,
    };
};

const applyTransaction = (state: FeeState, tx: Transaction): FeeState => {
    if (tx.side === "buy") {
        return {
            ...state,
            quantity: state.quantity + tx.quantity,
            invested:
                state.invested +
                tx.quantity * tx.price +
                (tx.operationFee ?? 0),
            lastPrice: tx.price,
        };
    }

    const avgCost = state.quantity > 0 ? state.invested / state.quantity : 0;
    const sellValue = tx.quantity * tx.price - (tx.operationFee ?? 0);
    const costBasis = tx.quantity * avgCost;

    return {
        ...state,
        realizedPnl: state.realizedPnl + (sellValue - costBasis),
        invested: Math.max(state.invested - costBasis, 0),
        quantity: Math.max(state.quantity - tx.quantity, 0),
        lastPrice: tx.price,
    };
};

const getTimestamp = (date: string): number => new Date(date).getTime();

export const computePositionWithFees = (
    transactions: Transaction[],
    annualFeePercent: number,
    untilTimestamp: number,
    currentPrice?: number
): FeeState => {
    const sorted = [...transactions].sort(
        (a, b) => getTimestamp(a.date) - getTimestamp(b.date)
    );

    let state: FeeState = {
        quantity: 0,
        invested: 0,
        realizedPnl: 0,
        lastFeeTimestamp: null,
        lastPrice: currentPrice ?? 0,
    };

    for (const tx of sorted) {
        const txTimestamp = getTimestamp(tx.date);
        const feeResult = applyAnnualFees(
            state.invested,
            state.quantity,
            state.lastPrice,
            annualFeePercent,
            state.lastFeeTimestamp,
            txTimestamp
        );
        state = {
            ...state,
            invested: feeResult.invested,
            lastFeeTimestamp: feeResult.lastFeeTimestamp,
        };
        state = applyTransaction(state, tx);
    }

    const finalPrice =
        currentPrice ??
        state.lastPrice ??
        sorted[sorted.length - 1]?.price ??
        0;
    state = {
        ...state,
        lastPrice: finalPrice,
    };

    const finalFees = applyAnnualFees(
        state.invested,
        state.quantity,
        state.lastPrice,
        annualFeePercent,
        state.lastFeeTimestamp,
        untilTimestamp
    );
    state = {
        ...state,
        invested: finalFees.invested,
        lastFeeTimestamp: finalFees.lastFeeTimestamp,
    };

    return state;
};
