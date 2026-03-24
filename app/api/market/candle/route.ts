// // ================================================================
// // app/api/market/candle/route.ts — GET OHLCV candle data
// // ================================================================
// export const dynamic = 'force-dynamic';

// import { NextRequest, NextResponse } from 'next/server';
// import { getCandles, FINNHUB_SYMBOLS, calcIndicators } from '@/lib/finnhub';

// // Resolution → look-back seconds
// const RESOLUTION_LOOKBACK: Record<string, number> = {
//   '5':  5  * 60 * 100,       // ~8 hours of 5min bars
//   '15': 15 * 60 * 200,       // ~2 days of 15min bars
//   '60': 60 * 60 * 100,       // ~4 days of hourly bars
//   'D':  86400 * 120,          // 120 calendar days
//   'W':  86400 * 7 * 104,      // ~2 years of weekly bars
//   'M':  86400 * 30 * 60,      // ~5 years of monthly bars
// };

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const id         = searchParams.get('id') ?? '';
//   const resolution = searchParams.get('resolution') ?? 'D';
//   const fromParam  = searchParams.get('from');
//   const toParam    = searchParams.get('to');

//   const sym = FINNHUB_SYMBOLS[id];
//   if (!sym) {
//     return NextResponse.json({ error: `Unknown asset id: ${id}` }, { status: 400 });
//   }

//   const to   = toParam   ? parseInt(toParam)   : Math.floor(Date.now() / 1000);
//   const from = fromParam ? parseInt(fromParam)  : to - (RESOLUTION_LOOKBACK[resolution] ?? 86400 * 120);

//   try {
//     const candles = await getCandles(sym.candle, resolution, from, to);

//     if (!candles) {
//       return NextResponse.json({ error: 'No candle data available', id, resolution }, { status: 200 });
//     }

//     // Build chart-ready array
//     const bars = candles.t.map((timestamp, i) => ({
//       timestamp,
//       date:   new Date(timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: resolution === 'W' || resolution === 'M' ? 'numeric' : undefined }),
//       open:   +candles.o[i].toFixed(4),
//       high:   +candles.h[i].toFixed(4),
//       low:    +candles.l[i].toFixed(4),
//       close:  +candles.c[i].toFixed(4),
//       volume: candles.v[i] ?? 0,
//     }));

//     // Calculate indicators
//     const indicators = calcIndicators(candles);

//     // Build indicator overlay arrays aligned with bars
//     const indicatorBars = bars.map((_, i) => ({
//       sma20: isNaN(indicators.sma20[i]) ? null : +indicators.sma20[i].toFixed(4),
//       sma50: isNaN(indicators.sma50[i]) ? null : +indicators.sma50[i].toFixed(4),
//       rsi14: isNaN(indicators.rsi14[i]) ? null : +indicators.rsi14[i].toFixed(2),
//       bbUpper: isNaN(indicators.bbUpper[i]) ? null : +indicators.bbUpper[i].toFixed(4),
//       bbLower: isNaN(indicators.bbLower[i]) ? null : +indicators.bbLower[i].toFixed(4),
//     }));

//     return NextResponse.json({
//       id,
//       symbol:    sym.candle,
//       resolution,
//       bars,
//       indicators: indicatorBars,
//       summary: {
//         currentRsi:   indicators.currentRsi?.toFixed(1) ?? null,
//         currentSma20: indicators.currentSma20?.toFixed(4) ?? null,
//         currentSma50: indicators.currentSma50?.toFixed(4) ?? null,
//       },
//       count: bars.length,
//     });

//   } catch (err: any) {
//     console.error('[GET /api/market/candle]', err.message);
//     return NextResponse.json({ error: err.message }, { status: 500 });
//   }
// }

// ================================================================
// app/api/market/candle/route.ts — OHLCV candle data with fallback
// ================================================================
// Priority:
//   1. Real Finnhub data (stocks on free tier, forex needs paid)
//   2. Realistic GBM-generated mock candles as fallback
//
// Finnhub free tier candle support:
//   ✅ Stocks (AAPL, MSFT, NVDA, TSLA) — daily candles work
//   ❌ Forex/Commodities (OANDA:*) — requires paid plan
//   → We generate realistic mock data for commodities automatically
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCandles, FINNHUB_SYMBOLS, calcIndicators, getQuote } from '@/lib/finnhub';
import { generateMockCandles } from '@/lib/mockCandles';

// Resolution → default look-back in seconds
const RESOLUTION_LOOKBACK: Record<string, number> = {
  '1':  60 * 200,
  '5':  300 * 200,
  '15': 900 * 200,
  '60': 3600 * 100,
  'D':  86400 * 120,
  'W':  86400 * 7 * 104,
  'M':  86400 * 30 * 60,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id         = searchParams.get('id') ?? '';
  const resolution = searchParams.get('resolution') ?? 'D';
  const fromParam  = searchParams.get('from');
  const toParam    = searchParams.get('to');

  const sym = FINNHUB_SYMBOLS[id as keyof typeof FINNHUB_SYMBOLS];
  if (!sym) {
    return NextResponse.json({ error: `Unknown asset id: ${id}` }, { status: 400 });
  }

  const to   = toParam   ? parseInt(toParam)   : Math.floor(Date.now() / 1000);
  const from = fromParam ? parseInt(fromParam)  : to - (RESOLUTION_LOOKBACK[resolution] ?? 86400 * 120);

  // ── Fetch current price for anchoring mock data ───────────────
  let currentPrice: number | undefined;
  try {
    const quote = await getQuote(sym.quote);
    currentPrice = quote?.c ?? undefined;
  } catch { /* ignore */ }

  // ── Attempt real Finnhub candle data ─────────────────────────
  // Only stocks work reliably on the free tier.
  // Forex/commodity (OANDA:*) candles require a paid plan.
  const isForex = sym.candle.startsWith('OANDA:') || sym.candle.includes(':');

  if (!isForex && process.env.FINNHUB_API_KEY) {
    try {
      const candles = await getCandles(sym.candle, resolution, from, to);

      if (candles && candles.t.length > 0) {
        const bars = candles.t.map((timestamp, i) => ({
          timestamp,
          date:   formatDateLabel(timestamp * 1000, resolution),
          open:   +candles.o[i].toFixed(4),
          high:   +candles.h[i].toFixed(4),
          low:    +candles.l[i].toFixed(4),
          close:  +candles.c[i].toFixed(4),
          volume: candles.v[i] ?? 0,
        }));

        const indicators    = calcIndicators(candles);
        const indicatorBars = bars.map((_, i) => ({
          sma20:   isNaN(indicators.sma20[i])   ? null : +indicators.sma20[i].toFixed(4),
          sma50:   isNaN(indicators.sma50[i])   ? null : +indicators.sma50[i].toFixed(4),
          rsi14:   isNaN(indicators.rsi14[i])   ? null : +indicators.rsi14[i].toFixed(2),
          bbUpper: isNaN(indicators.bbUpper[i]) ? null : +indicators.bbUpper[i].toFixed(4),
          bbLower: isNaN(indicators.bbLower[i]) ? null : +indicators.bbLower[i].toFixed(4),
        }));

        return NextResponse.json({
          id, symbol: sym.candle, resolution,
          bars, indicators: indicatorBars,
          summary: {
            currentRsi:   indicators.currentRsi?.toFixed(1)   ?? null,
            currentSma20: indicators.currentSma20?.toFixed(4) ?? null,
            currentSma50: indicators.currentSma50?.toFixed(4) ?? null,
          },
          count:  bars.length,
          isMock: false,
          source: 'finnhub',
        });
      }
    } catch (err: any) {
      console.warn(`[candle] Finnhub failed for ${sym.candle}:`, err.message);
    }
  }

  // ── Fallback: generate realistic mock candles ─────────────────
  console.log(`[candle] Using mock candles for ${id} (${isForex ? 'forex/commodity — needs paid Finnhub' : 'Finnhub returned no data'})`);
  const mock = generateMockCandles(id, resolution, from, to, currentPrice);

  return NextResponse.json({
    id, symbol: sym.candle, resolution,
    bars:        mock.bars,
    indicators:  mock.indicators,
    summary:     mock.summary,
    count:       mock.bars.length,
    isMock:      true,
    source:      isForex ? 'mock (forex candles need Finnhub paid plan)' : 'mock (API returned no data)',
  });
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