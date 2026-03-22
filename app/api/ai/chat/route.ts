// ================================================================
// app/api/ai/chat/route.ts — OpenRouter-powered AI chat
// ================================================================
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// System prompt that gives the AI deep financial analyst context
const SYSTEM_PROMPT = `You are NexusAI, an elite financial analyst and investment intelligence assistant built into a professional trading platform. You have deep expertise in:

- Multi-asset markets: equities, commodities (gold, silver, crude oil, copper), forex
- Technical analysis: RSI, MACD, Bollinger Bands, moving averages, support/resistance
- Fundamental analysis: macroeconomics, central bank policy, geopolitical risk
- Portfolio management: diversification, risk-adjusted returns, rebalancing
- Market psychology: sentiment analysis, fear/greed cycles

PERSONALITY & TONE:
- Precise, data-driven, and confident — like a Goldman Sachs analyst
- Use specific numbers, percentages, and price levels when relevant
- Structure long responses with clear sections using **bold headers**
- Format key data in bullet points for readability
- Always caveat with risk disclaimers when giving directional calls

FORMATTING RULES:
- Use **bold** for asset names, key levels, and important terms
- Use bullet points (•) for lists of factors or points
- Use → for price targets and projections
- Keep responses concise but substantive (150-300 words unless detailed analysis requested)
- End with a brief Risk Note when making predictions

CURRENT CONTEXT:
- Platform: NexusAI Investment Intelligence Platform
- Assets tracked: Gold (XAU/USD), Silver (XAG/USD), Crude Oil (WTI), Copper (HG), Apple (AAPL), Microsoft (MSFT), NVIDIA (NVDA), Tesla (TSLA)
- Date context: Always respond as if you have current market awareness

IMPORTANT: Never make up specific real-time prices — acknowledge when you need live data and offer analysis based on general market dynamics instead.`;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model  = process.env.OPENROUTER_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free';

  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY is not configured. Add it to .env.local to enable real AI responses.' },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { messages }: { messages: ChatMessage[] } = body;

    if (!messages?.length) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Build messages array — keep last 10 for context window efficiency
    const recentMessages = messages.slice(-10);

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  'https://nexusai.app',
        'X-Title':       'NexusAI Investment Platform',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentMessages,
        ],
        temperature:       0.65,
        max_tokens:        600,
        top_p:             0.9,
        frequency_penalty: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[OpenRouter]', res.status, errText);

      // Provide helpful error messages
      if (res.status === 401) {
        return NextResponse.json({ error: 'Invalid OpenRouter API key. Check OPENROUTER_API_KEY in .env.local' }, { status: 401 });
      }
      if (res.status === 429) {
        return NextResponse.json({ error: 'Rate limit reached. Please wait a moment before sending another message.' }, { status: 429 });
      }
      return NextResponse.json({ error: `OpenRouter error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from AI model' }, { status: 500 });
    }

    return NextResponse.json({
      content,
      model:  data.model ?? model,
      usage:  data.usage ?? null,
    });

  } catch (err: any) {
    console.error('[POST /api/ai/chat]', err.message);
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}