// ================================================================
// lib/finnhub.ts — Finnhub API client (server-side)
// ================================================================
// Free tier: 60 API calls/minute, real-time US stocks + forex/commodities
// Sign up: https://finnhub.io/register
// Docs:    https://finnhub.io/docs/api
// ================================================================

const BASE = 'https://finnhub.io/api/v1';

function apiKey() {
  const k = process.env.FINNHUB_API_KEY;
  if (!k) throw new Error('FINNHUB_API_KEY is not set in .env.local');
  return k;
}

function url(path: string, params: Record<string, string | number> = {}) {
  const p = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), token: apiKey() });
  return `${BASE}${path}?${p}`;
}

// ── Types ────────────────────────────────────────────────────────

export interface FinnhubQuote {
  c: number;   // current price
  d: number;   // change
  dp: number;   // change percent
  h: number;   // 24h high
  l: number;   // 24h low
  o: number;   // open
  pc: number;   // previous close
  t: number;   // timestamp
}

export interface FinnhubCandle {
  c: number[];  // close prices
  h: number[];  // highs
  l: number[];  // lows
  o: number[];  // opens
  v: number[];  // volumes
  t: number[];  // timestamps (unix)
  s: string;    // status: 'ok' | 'no_data'
}

export interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  name: string;
  ticker: string;
  ipo: string;
  marketCap: number;
  shareOutstanding: number;
  logo: string;
  weburl: string;
  finnhubIndustry: string;
}

// ── Finnhub symbol map ────────────────────────────────────────────
// Maps our internal asset IDs to Finnhub symbols
// export const FINNHUB_SYMBOLS: Record<string, { quote: string; candle: string; type: 'stock' | 'forex'; newsSymbol?: string }> = {
//   gold:      { quote: 'GC=F', candle: 'GC=F', type: 'stock',  newsSymbol: 'gold' },
//   silver:    { quote: 'SI=F', candle: 'SI=F', type: 'stock',  newsSymbol: 'silver' },
//  'crude-oil':{ quote: 'CL=F',candle: 'CL=F', type: 'stock',  newsSymbol: 'crude oil' },
//   copper: { quote: 'HG=F', candle: 'HG=F', type: 'stock' },
//   aapl:      { quote: 'AAPL',candle: 'AAPL',type: 'stock',  newsSymbol: 'AAPL' },
//   msft:      { quote: 'MSFT',          candle: 'MSFT',           type: 'stock',  newsSymbol: 'MSFT' },
//   nvda:      { quote: 'NVDA',          candle: 'NVDA',           type: 'stock',  newsSymbol: 'NVDA' },
//   tsla:      { quote: 'TSLA',          candle: 'TSLA',           type: 'stock',  newsSymbol: 'TSLA' },
// };
export const FINNHUB_SYMBOLS = {
  gold: { quote: 'OANDA:XAU_USD', candle: 'OANDA:XAU_USD', type: 'forex' },
  silver: { quote: 'OANDA:XAG_USD', candle: 'OANDA:XAG_USD', type: 'forex' },
  'crude-oil': { quote: 'OANDA:BCO_USD', candle: 'OANDA:BCO_USD', type: 'forex' },
  copper: { quote: 'OANDA:XCU_USD', candle: 'OANDA:XCU_USD', type: 'forex' },

  aapl: { quote: 'AAPL', candle: 'AAPL', type: 'stock' },
  msft: { quote: 'MSFT', candle: 'MSFT', type: 'stock' },
  nvda: { quote: 'NVDA', candle: 'NVDA', type: 'stock' },
  tsla: { quote: 'TSLA', candle: 'TSLA', type: 'stock' },
};

// ── API functions ────────────────────────────────────────────────

/**
 * Get real-time quote for a symbol.
 * Works for stocks (AAPL) and forex/commodities (OANDA:XAU_USD)
 */
export async function getQuote(symbol: string): Promise<FinnhubQuote | null> {
  try {
    const res = await fetch(url('/quote', { symbol }), { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const data = await res.json();
    // if (!data.c || data.c === 0) return null;
    if (!data || data.c === undefined) return null;
    return data as FinnhubQuote;
  } catch (err) {
    console.error("Finnhub Error:", err);
    return null;
  }
}

/**
 * Get OHLCV candle data for charting.
 * resolution: 1, 5, 15, 30, 60 (minutes), D, W, M
 * from/to: Unix timestamps
 */
export async function getCandles(
  symbol: string,
  resolution: string = '5',
  from: number,
  to: number
): Promise<FinnhubCandle | null> {
  try {
    const endpoint = symbol.startsWith('OANDA:') ? '/forex/candle' : '/stock/candle';
    
    const res = await fetch(url(endpoint, { symbol, resolution, from, to }), {
      next: { revalidate: 300 }
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.s !== 'ok') return null;
    return data as FinnhubCandle;
  } catch (err) {
    console.error("Finnhub Error:", err);
    return null;
  }
}

/**
 * Get company news (stocks only)
 */
export async function getCompanyNews(
  symbol: string,
  from: string,  // YYYY-MM-DD
  to: string
): Promise<FinnhubNewsItem[]> {
  try {
    const res = await fetch(url('/company-news', { symbol, from, to }), {
      next: { revalidate: 900 }  // 15 min cache
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * Get general market/category news
 * category: general, forex, crypto, merger
 */
export async function getMarketNews(category: string = 'general'): Promise<FinnhubNewsItem[]> {
  try {
    const res = await fetch(url('/news', { category }), {
      next: { revalidate: 900 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data) ? data : []).slice(0, 10);
  } catch {
    return [];
  }
}

/**
 * Get company profile (stocks only)
 */
export async function getProfile(symbol: string): Promise<FinnhubProfile | null> {
  try {
    const res = await fetch(url('/stock/profile2', { symbol }), {
      next: { revalidate: 86400 }  // 24h cache
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Finnhub Error:", err);
    return null;
  }
}

/**
 * Batch-fetch quotes for multiple asset IDs (our internal IDs)
 * Returns a map of assetId → live price data
 */
export async function batchQuotes(assetIds: string[]): Promise<Record<string, FinnhubQuote>> {
  const results: Record<string, FinnhubQuote> = {};
  await Promise.allSettled(
    assetIds.map(async (id) => {
      const sym = FINNHUB_SYMBOLS[id as keyof typeof FINNHUB_SYMBOLS];
      if (!sym) return;
      const q = await getQuote(sym.quote);
      if (q) results[id] = q;
    })
  );
  return results;
}

/**
 * Calculate simple technical indicators from candle data
 */
export function calcIndicators(candles: FinnhubCandle) {
  const closes = candles.c;
  const n = closes.length;

  // SMA helper
  const sma = (period: number): number[] =>
    closes.map((_, i) =>
      i < period - 1
        ? NaN
        : closes.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period
    );

  // RSI (14-period)
  const rsi14: number[] = new Array(n).fill(NaN);
  if (n >= 15) {
    let gains = 0, losses = 0;
    for (let i = 1; i <= 14; i++) {
      const d = closes[i] - closes[i - 1];
      if (d >= 0) gains += d; else losses -= d;
    }
    let avgGain = gains / 14;
    let avgLoss = losses / 14;
    rsi14[14] = 100 - 100 / (1 + avgGain / (avgLoss || 0.001));
    for (let i = 15; i < n; i++) {
      const d = closes[i] - closes[i - 1];
      avgGain = (avgGain * 13 + (d > 0 ? d : 0)) / 14;
      avgLoss = (avgLoss * 13 + (d < 0 ? -d : 0)) / 14;
      rsi14[i] = 100 - 100 / (1 + avgGain / (avgLoss || 0.001));
    }
  }

  // Bollinger Bands (20-period, 2 std dev)
  const sma20 = sma(20);
  const bbUpper: number[] = new Array(n).fill(NaN);
  const bbLower: number[] = new Array(n).fill(NaN);
  for (let i = 19; i < n; i++) {
    const slice = closes.slice(i - 19, i + 1);
    const mean = sma20[i];
    const std = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20);
    bbUpper[i] = mean + 2 * std;
    bbLower[i] = mean - 2 * std;
  }

  return {
    sma20,
    sma50: sma(50),
    rsi14,
    bbUpper,
    bbLower,
    currentRsi: rsi14[n - 1],
    currentSma20: sma20[n - 1],
    currentSma50: sma(50)[n - 1],
  };
}