// ================================================================
// app/api/market/analyze/route.ts — POST: AI market analysis
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { analyzeAsset } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      assetName, symbol, currentPrice, change24h,
      high24h, low24h, priceHistory,
      rsi14, sma20, sma50, newsHeadlines,
    } = body;

    // Validate required fields
    if (!assetName || !symbol || !currentPrice) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await analyzeAsset({
      assetName,
      symbol,
      currentPrice,
      change24h:    change24h ?? 0,
      high24h:      high24h   ?? currentPrice,
      low24h:       low24h    ?? currentPrice,
      priceHistory: priceHistory ?? [],
      rsi14:        rsi14 ?? 50,
      sma20:        sma20 ?? currentPrice,
      sma50:        sma50 ?? currentPrice,
      newsHeadlines: newsHeadlines ?? [],
    });

    return NextResponse.json(result);

  } catch (err: any) {
    console.error('[POST /api/market/analyze]', err.message);
    return NextResponse.json(
      { error: err.message ?? 'Analysis failed' },
      { status: 500 }
    );
  }
}