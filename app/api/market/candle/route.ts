// ================================================================
// app/api/market/candle/route.ts — GET OHLCV candle data
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCandles, FINNHUB_SYMBOLS, calcIndicators } from '@/lib/finnhub';

// Resolution → look-back seconds
const RESOLUTION_LOOKBACK: Record<string, number> = {
  '5':  5  * 60 * 100,       // ~8 hours of 5min bars
  '15': 15 * 60 * 200,       // ~2 days of 15min bars
  '60': 60 * 60 * 100,       // ~4 days of hourly bars
  'D':  86400 * 120,          // 120 calendar days
  'W':  86400 * 7 * 104,      // ~2 years of weekly bars
  'M':  86400 * 30 * 60,      // ~5 years of monthly bars
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id         = searchParams.get('id') ?? '';
  const resolution = searchParams.get('resolution') ?? 'D';
  const fromParam  = searchParams.get('from');
  const toParam    = searchParams.get('to');

  const sym = FINNHUB_SYMBOLS[id];
  if (!sym) {
    return NextResponse.json({ error: `Unknown asset id: ${id}` }, { status: 400 });
  }

  const to   = toParam   ? parseInt(toParam)   : Math.floor(Date.now() / 1000);
  const from = fromParam ? parseInt(fromParam)  : to - (RESOLUTION_LOOKBACK[resolution] ?? 86400 * 120);

  try {
    const candles = await getCandles(sym.candle, resolution, from, to);

    if (!candles) {
      return NextResponse.json({ error: 'No candle data available', id, resolution }, { status: 200 });
    }

    // Build chart-ready array
    const bars = candles.t.map((timestamp, i) => ({
      timestamp,
      date:   new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: resolution === 'W' || resolution === 'M' ? 'numeric' : undefined }),
      open:   +candles.o[i].toFixed(4),
      high:   +candles.h[i].toFixed(4),
      low:    +candles.l[i].toFixed(4),
      close:  +candles.c[i].toFixed(4),
      volume: candles.v[i] ?? 0,
    }));

    // Calculate indicators
    const indicators = calcIndicators(candles);

    // Build indicator overlay arrays aligned with bars
    const indicatorBars = bars.map((_, i) => ({
      sma20: isNaN(indicators.sma20[i]) ? null : +indicators.sma20[i].toFixed(4),
      sma50: isNaN(indicators.sma50[i]) ? null : +indicators.sma50[i].toFixed(4),
      rsi14: isNaN(indicators.rsi14[i]) ? null : +indicators.rsi14[i].toFixed(2),
      bbUpper: isNaN(indicators.bbUpper[i]) ? null : +indicators.bbUpper[i].toFixed(4),
      bbLower: isNaN(indicators.bbLower[i]) ? null : +indicators.bbLower[i].toFixed(4),
    }));

    return NextResponse.json({
      id,
      symbol:    sym.candle,
      resolution,
      bars,
      indicators: indicatorBars,
      summary: {
        currentRsi:   indicators.currentRsi?.toFixed(1) ?? null,
        currentSma20: indicators.currentSma20?.toFixed(4) ?? null,
        currentSma50: indicators.currentSma50?.toFixed(4) ?? null,
      },
      count: bars.length,
    });

  } catch (err: any) {
    console.error('[GET /api/market/candle]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}