// // ================================================================
// // app/api/market/quotes/route.ts — GET real-time quotes
// // ================================================================
// export const dynamic = 'force-dynamic';

// import { NextRequest, NextResponse } from 'next/server';
// import { batchQuotes, FINNHUB_SYMBOLS } from '@/lib/finnhub';
// import { ASSETS } from '@/lib/mockData';

// export async function GET(req: NextRequest) {
//   const { searchParams } = new URL(req.url);
//   const idsParam = searchParams.get('ids');

//   // Parse requested asset IDs (default = all)
//   const requestedIds = idsParam
//     ? idsParam.split(',').map((s) => s.trim())
//     : Object.keys(FINNHUB_SYMBOLS);

//   try {
//     // Fetch live quotes from Finnhub
//     const liveQuotes = await batchQuotes(requestedIds);

//     // Merge with mock data as fallback
//     const result = requestedIds.map((id) => {
//       const mock  = ASSETS.find((a) => a.id === id);
//       const live  = liveQuotes[id];

//       if (!live || !mock) return mock ?? null;

//       return {
//         id:         mock.id,
//         name:       mock.name,
//         symbol:     mock.symbol,
//         category:   mock.category,
//         price:      live.c,
//         change:     live.dp,
//         changeAbs:  live.d,
//         high24h:    live.h,
//         low24h:     live.l,
//         open:       live.o,
//         prevClose:  live.pc,
//         volume:     mock.volume,        // Finnhub free doesn't expose volume on /quote
//         marketCap:  mock.marketCap,
//         sparkline:  mock.sparkline,     // updated separately via candle endpoint
//         timestamp:  live.t,
//         isLive:     true,
//       };
//     }).filter(Boolean);

//     return NextResponse.json({ assets: result, fetchedAt: new Date().toISOString() });

//   } catch (err: any) {
//     console.error('[GET /api/market/quotes]', err.message);

//     // Return mock data as fallback so dashboard never breaks
//     const fallback = ASSETS.filter((a) => requestedIds.includes(a.id)).map((a) => ({
//       ...a, isLive: false,
//     }));

//     return NextResponse.json(
//       { assets: fallback, fetchedAt: new Date().toISOString(), error: 'Using cached data' },
//       { status: 200 }
//     );
//   }
// }

// ================================================================
// app/api/market/quotes/route.ts — Real-time quotes from Finnhub
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { batchQuotes, FINNHUB_SYMBOLS } from '@/lib/finnhub';
import { ASSETS } from '@/lib/mockData';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idsParam   = searchParams.get('ids');
  const requestedIds = idsParam
    ? idsParam.split(',').map((s) => s.trim())
    : Object.keys(FINNHUB_SYMBOLS);

  // ── If no API key, return mock data immediately ───────────────
  if (!process.env.FINNHUB_API_KEY) {
    const fallback = ASSETS
      .filter((a) => requestedIds.includes(a.id))
      .map((a) => ({ ...a, isLive: false, source: 'mock' }));
    return NextResponse.json({
      assets:    fallback,
      fetchedAt: new Date().toISOString(),
      isLive:    false,
      note:      'Add FINNHUB_API_KEY to .env.local for live prices',
    });
  }

  // ── Fetch live quotes ─────────────────────────────────────────
  try {
    const liveQuotes = await batchQuotes(requestedIds);
    const liveFetched = Object.keys(liveQuotes).length;

    const result = requestedIds.map((id) => {
      const mock = ASSETS.find((a) => a.id === id);
      const live = liveQuotes[id];

      if (!live || !mock) {
        return mock ? { ...mock, isLive: false } : null;
      }

      // Validate: if price is 0 or missing, fall back to mock
      if (!live.c || live.c === 0) {
        return { ...mock, isLive: false };
      }

      return {
        id:         mock.id,
        name:       mock.name,
        symbol:     mock.symbol,
        category:   mock.category,
        price:      +live.c.toFixed(4),
        change:     +live.dp.toFixed(2),
        changeAbs:  +live.d.toFixed(4),
        high24h:    +live.h.toFixed(4),
        low24h:     +live.l.toFixed(4),
        open:       +live.o.toFixed(4),
        prevClose:  +live.pc.toFixed(4),
        volume:     mock.volume,
        marketCap:  mock.marketCap,
        sparkline:  mock.sparkline,
        timestamp:  live.t,
        isLive:     true,
        source:     'finnhub',
      };
    }).filter(Boolean);

    const anyLive = result.some((a: any) => a?.isLive === true);

    return NextResponse.json({
      assets:    result,
      fetchedAt: new Date().toISOString(),
      isLive:    anyLive,
      liveCount: liveFetched,
    });

  } catch (err: any) {
    console.error('[GET /api/market/quotes]', err.message);

    const fallback = ASSETS
      .filter((a) => requestedIds.includes(a.id))
      .map((a) => ({ ...a, isLive: false }));

    return NextResponse.json({
      assets:    fallback,
      fetchedAt: new Date().toISOString(),
      isLive:    false,
      error:     'Finnhub request failed — using cached data',
    });
  }
}