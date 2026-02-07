export const rangeValues = [
    "1d",
    "1w",
    "1m",
    "ytd",
    "1y",
    "2y",
    "5y",
    "10y",
    "all",
] as const;

export type RangeValue = (typeof rangeValues)[number];

export const rangeToYahoo: Record<RangeValue, string> = {
    "1d": "1d",
    "1w": "5d",
    "1m": "1mo",
    ytd: "ytd",
    "1y": "1y",
    "2y": "2y",
    "5y": "5y",
    "10y": "10y",
    all: "max",
};

export const rangeToInterval: Record<RangeValue, string> = {
    "1d": "5m",
    "1w": "30m",
    "1m": "1d",
    ytd: "1d",
    "1y": "1d",
    "2y": "1wk",
    "5y": "1wk",
    "10y": "1mo",
    all: "1mo",
};
