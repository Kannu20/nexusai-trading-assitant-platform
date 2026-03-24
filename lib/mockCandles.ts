// ================================================================
// lib/mockCandles.ts — Realistic mock OHLCV candle generator
// ================================================================
// Used as fallback when Finnhub free tier doesn't support forex/
// commodity candles (OANDA symbols need paid plan).
// Generates statistically realistic price action using GBM + volatility.
// ================================================================

import { calcIndicators, type FinnhubCandle } from './finnhub';
import { ASSETS } from './mockData';

// Asset-specific volatility profiles (daily % std dev)
const VOLATILITY: Record<string, number> = {
  gold:       0.008,   // 0.8% daily vol
  silver:     0.014,   // 1.4%
  'crude-oil': 0.018,  // 1.8%
  copper:     0.012,   // 1.2%
  aapl:       0.016,   // 1.6%
  msft:       0.015,   // 1.5%
  nvda:       0.030,   // 3.0% (high vol)
  tsla:       0.035,   // 3.5% (high vol)
};

// Asset-specific drift (slight upward bias for stocks, neutral for commodities)
const DRIFT: Record<string, number> = {
  gold:       0.0003,
  silver:     0.0002,
  'crude-oil': 0.0001,
  copper:     0.0002,
  aapl:       0.0004,
  msft:       0.0004,
  nvda:       0.0006,
  tsla:       0.0003,
};

/**
 * Seeded pseudo-random number generator (deterministic per asset + date).
 * Ensures the mock data looks the same on repeated calls.
 */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

/** Box-Muller transform: uniform → normal distribution */
function normalRandom(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-10);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate realistic OHLCV candle data using Geometric Brownian Motion.
 *
 * @param assetId    - Our internal asset ID (gold, aapl, etc.)
 * @param resolution - Candle resolution: '60', 'D', 'W', 'M'
 * @param fromTs     - Start unix timestamp (seconds)
 * @param toTs       - End unix timestamp (seconds)
 * @param currentPrice - Latest known price (anchor the simulation)
 */
export function generateMockCandles(
  assetId:      string,
  resolution:   string,
  fromTs:       number,
  toTs:         number,
  currentPrice?: number,
): { bars: CandleBar[]; indicators: IndicatorBar[]; summary: CandleSummary; isMock: true } {
  const asset       = ASSETS.find((a) => a.id === assetId);
  const basePrice   = currentPrice ?? asset?.price ?? 100;
  const vol         = VOLATILITY[assetId]  ?? 0.015;
  const drift       = DRIFT[assetId]       ?? 0.0002;

  // Determine bar interval in seconds
  const intervalSec = resolutionToSeconds(resolution);
  const totalBars   = Math.min(
    Math.floor((toTs - fromTs) / intervalSec),
    500   // cap to avoid huge arrays
  );

  if (totalBars <= 0) {
    return emptyResult();
  }

  // Seed based on asset + approximate time window (stable per asset per week)
  const seed     = hashString(`${assetId}-${resolution}-${Math.floor(fromTs / 604800)}`);
  const rand     = seededRandom(seed);

  // Work backwards from current price using GBM reverse
  const prices: number[] = new Array(totalBars + 1);
  prices[totalBars] = basePrice;
  for (let i = totalBars - 1; i >= 0; i--) {
    const z     = normalRandom(rand);
    const scale = Math.sqrt(intervalSec / 86400); // scale vol to bar size
    prices[i] = prices[i + 1] * Math.exp((-drift - 0.5 * vol * vol) * scale + vol * scale * z);
  }

  const bars: CandleBar[] = [];

  for (let i = 0; i < totalBars; i++) {
    const ts    = fromTs + i * intervalSec;
    const open  = prices[i];
    const close = prices[i + 1];

    // Generate realistic high/low using intra-bar volatility
    const intraVol = vol * 0.6 * Math.sqrt(intervalSec / 86400);
    const range    = Math.max(Math.abs(close - open), basePrice * intraVol * 0.5);
    const high     = Math.max(open, close) + range * (rand() * 0.8);
    const low      = Math.min(open, close) - range * (rand() * 0.8);

    // Volume: base volume with realistic variation
    const baseVol  = getBaseVolume(assetId, resolution);
    const volume   = Math.round(baseVol * (0.5 + rand()));

    const dateLabel = formatDateLabel(ts * 1000, resolution);

    bars.push({
      timestamp: ts,
      date:      dateLabel,
      open:      round(open),
      high:      round(high),
      low:       Math.max(round(low), round(low * 0.998)), // prevent negative
      close:     round(close),
      volume,
    });
  }

  // Build FinnhubCandle-compatible object for indicator calculation
  const finnhubCandle: FinnhubCandle = {
    o: bars.map((b) => b.open),
    h: bars.map((b) => b.high),
    l: bars.map((b) => b.low),
    c: bars.map((b) => b.close),
    v: bars.map((b) => b.volume),
    t: bars.map((b) => b.timestamp),
    s: 'ok',
  };

  const indicators    = calcIndicators(finnhubCandle);
  const indicatorBars = bars.map((_, i) => ({
    sma20:   isNaN(indicators.sma20[i])   ? null : round(indicators.sma20[i]),
    sma50:   isNaN(indicators.sma50[i])   ? null : round(indicators.sma50[i]),
    rsi14:   isNaN(indicators.rsi14[i])   ? null : +indicators.rsi14[i].toFixed(2),
    bbUpper: isNaN(indicators.bbUpper[i]) ? null : round(indicators.bbUpper[i]),
    bbLower: isNaN(indicators.bbLower[i]) ? null : round(indicators.bbLower[i]),
  }));

  return {
    bars,
    indicators: indicatorBars,
    summary: {
      currentRsi:   indicators.currentRsi   != null ? indicators.currentRsi.toFixed(1)   : null,
      currentSma20: indicators.currentSma20 != null ? indicators.currentSma20.toFixed(4) : null,
      currentSma50: indicators.currentSma50 != null ? indicators.currentSma50.toFixed(4) : null,
    },
    isMock: true,
  };
}

// ── Types ─────────────────────────────────────────────────────────
export interface CandleBar {
  timestamp: number;
  date:      string;
  open:      number;
  high:      number;
  low:       number;
  close:     number;
  volume:    number;
}

export interface IndicatorBar {
  sma20:   number | null;
  sma50:   number | null;
  rsi14:   number | null;
  bbUpper: number | null;
  bbLower: number | null;
}

export interface CandleSummary {
  currentRsi:   string | null;
  currentSma20: string | null;
  currentSma50: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────
function resolutionToSeconds(resolution: string): number {
  const map: Record<string, number> = {
    '1':  60,
    '5':  300,
    '15': 900,
    '30': 1800,
    '60': 3600,
    'D':  86400,
    'W':  604800,
    'M':  2592000,
  };
  return map[resolution] ?? 86400;
}

function formatDateLabel(ms: number, resolution: string): string {
  const d = new Date(ms);
  if (resolution === 'W' || resolution === 'M') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  if (resolution === 'D') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function getBaseVolume(assetId: string, resolution: string): number {
  const dailyVol: Record<string, number> = {
    gold: 500000, silver: 300000, 'crude-oil': 800000, copper: 200000,
    aapl: 60000000, msft: 25000000, nvda: 45000000, tsla: 80000000,
  };
  const base    = dailyVol[assetId] ?? 1000000;
  const factor  = resolutionToSeconds(resolution) / 86400;
  return Math.round(base * factor);
}

function round(n: number): number {
  // Dynamic precision based on price magnitude
  if (n >= 1000) return +n.toFixed(2);
  if (n >= 100)  return +n.toFixed(2);
  if (n >= 10)   return +n.toFixed(3);
  return +n.toFixed(4);
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}

function emptyResult() {
  return { bars: [], indicators: [], summary: { currentRsi: null, currentSma20: null, currentSma50: null }, isMock: true as const };
}