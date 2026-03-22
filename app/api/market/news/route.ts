// ================================================================
// app/api/market/news/route.ts — GET asset-specific news
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  getCompanyNews,
  getMarketNews,
  FINNHUB_SYMBOLS,
  type FinnhubNewsItem,
} from '@/lib/finnhub';

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id    = searchParams.get('id') ?? '';
  const limit = parseInt(searchParams.get('limit') ?? '10');

  const sym = FINNHUB_SYMBOLS[id];
  if (!sym) {
    return NextResponse.json({ error: `Unknown asset id: ${id}` }, { status: 400 });
  }

  try {
    let news: FinnhubNewsItem[] = [];

    if (sym.type === 'stock') {
      // For stocks: use company-specific news (last 7 days)
      news = await getCompanyNews(sym.quote, dateStr(7), dateStr(0));

      // If not enough results, also grab general market news
      if (news.length < 5) {
        const general = await getMarketNews('general');
        news = [...news, ...general].slice(0, limit);
      }
    } else {
      // For commodities/forex: use general forex/general market news
      const [forexNews, generalNews] = await Promise.all([
        getMarketNews('forex'),
        getMarketNews('general'),
      ]);
      // Interleave and deduplicate by id
      const combined = [...forexNews, ...generalNews];
      const seen = new Set<number>();
      news = combined.filter((n) => {
        if (seen.has(n.id)) return false;
        seen.add(n.id);
        return true;
      });
    }

    // Normalize output
    const items = news.slice(0, limit).map((n) => ({
      id:        n.id,
      headline:  n.headline,
      summary:   n.summary?.slice(0, 200) ?? '',
      source:    n.source,
      url:       n.url,
      image:     n.image || null,
      datetime:  n.datetime * 1000,   // convert to ms for JS Date
      timeAgo:   timeAgo(n.datetime),
    }));

    return NextResponse.json({ id, items, count: items.length });

  } catch (err: any) {
    console.error('[GET /api/market/news]', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function timeAgo(unixSec: number): string {
  const diff = Date.now() / 1000 - unixSec;
  if (diff < 3600)  return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}