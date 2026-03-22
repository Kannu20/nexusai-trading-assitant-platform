// ================================================================
// lib/openrouter.ts — OpenRouter AI client for market analysis
// ================================================================
// Sign up: https://openrouter.ai
// Free models: meta-llama/llama-3.1-8b-instruct:free
//              mistralai/mistral-7b-instruct:free
// ================================================================

export interface AnalysisResult {
  sentiment:    'bullish' | 'neutral' | 'bearish';
  score:        number;           // 0-100
  summary:      string;
  target7d:     number;           // predicted price in 7 days
  target30d:    number;           // predicted price in 30 days
  riskLevel:    'Low' | 'Medium' | 'High';
  keyFactors:   string[];         // 3-5 bullet factors
  technicals:   string;           // technical analysis paragraph
  fundamentals: string;           // fundamental/macro paragraph
  recommendation: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  confidence:   number;           // 0-100
  generatedAt:  string;
}

interface AnalysisInput {
  assetName:    string;
  symbol:       string;
  currentPrice: number;
  change24h:    number;
  high24h:      number;
  low24h:       number;
  priceHistory: { date: string; close: number; volume?: number }[];
  rsi14:        number;
  sma20:        number;
  sma50:        number;
  newsHeadlines: string[];
}

export async function analyzeAsset(input: AnalysisInput): Promise<AnalysisResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model  = process.env.OPENROUTER_MODEL ?? 'openai/gpt-3.5-turbo';

  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  // Build a compact price history string (last 14 days)
  const recentHistory = input.priceHistory.slice(-14)
    .map((p) => `${p.date}: $${p.close.toFixed(2)}`)
    .join(', ');

  const priceChange30d = input.priceHistory.length > 30
    ? ((input.currentPrice - input.priceHistory[input.priceHistory.length - 31].close) / input.priceHistory[input.priceHistory.length - 31].close * 100).toFixed(2)
    : 'N/A';

  const prompt = `You are a professional financial analyst. Analyze the following asset and provide a structured JSON prediction.

ASSET: ${input.assetName} (${input.symbol})
Current Price: $${input.currentPrice.toFixed(2)}
24h Change: ${input.change24h.toFixed(2)}%
24h High: $${input.high24h.toFixed(2)}
24h Low: $${input.low24h.toFixed(2)}
30-day Price Change: ${priceChange30d}%

TECHNICAL INDICATORS:
RSI (14): ${input.rsi14.toFixed(1)} ${input.rsi14 > 70 ? '(Overbought)' : input.rsi14 < 30 ? '(Oversold)' : '(Neutral)'}
SMA 20: $${input.sma20.toFixed(2)} — Price is ${input.currentPrice > input.sma20 ? 'ABOVE' : 'BELOW'} SMA20
SMA 50: $${input.sma50.toFixed(2)} — Price is ${input.currentPrice > input.sma50 ? 'ABOVE' : 'BELOW'} SMA50

RECENT PRICE HISTORY (last 14 days):
${recentHistory}

RECENT NEWS:
${input.newsHeadlines.slice(0, 5).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Respond ONLY with a valid JSON object (no markdown, no explanation outside JSON):
{
  "sentiment": "bullish" | "neutral" | "bearish",
  "score": <number 0-100, where 0=very bearish, 50=neutral, 100=very bullish>,
  "summary": "<2 sentence executive summary>",
  "target7d": <predicted price 7 days from now>,
  "target30d": <predicted price 30 days from now>,
  "riskLevel": "Low" | "Medium" | "High",
  "keyFactors": ["<factor 1>", "<factor 2>", "<factor 3>", "<factor 4>"],
  "technicals": "<1-2 sentences on technical setup>",
  "fundamentals": "<1-2 sentences on macro/fundamental context>",
  "recommendation": "Strong Buy" | "Buy" | "Hold" | "Sell" | "Strong Sell",
  "confidence": <number 0-100>
}`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization':   `Bearer ${apiKey}`,
      'Content-Type':    'application/json',
      'HTTP-Referer':    'https://nexusai.app',
      'X-Title':         'NexusAI Investment Platform',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens:  800,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw  = data.choices?.[0]?.message?.content ?? '';

  // Strip any markdown code fences before parsing
  const cleaned = raw.replace(/```json|```/g, '').trim();

  let parsed: Partial<AnalysisResult>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback if model returns broken JSON
    parsed = {
      sentiment:     'neutral',
      score:         50,
      summary:       `${input.assetName} is currently showing mixed signals. Monitor key support and resistance levels.`,
      target7d:      input.currentPrice * 1.01,
      target30d:     input.currentPrice * 1.03,
      riskLevel:     'Medium',
      keyFactors:    ['Monitor RSI for overbought/oversold signals', 'Price action relative to moving averages is key', 'Watch global macro events'],
      technicals:    `RSI at ${input.rsi14.toFixed(0)} with price ${input.currentPrice > input.sma20 ? 'above' : 'below'} 20-day SMA.`,
      fundamentals:  'Market conditions remain uncertain. Diversification is recommended.',
      recommendation:'Hold',
      confidence:    45,
    };
  }

  return {
    ...parsed,
    sentiment:      parsed.sentiment ?? 'neutral',
    score:          parsed.score ?? 50,
    summary:        parsed.summary ?? '',
    target7d:       parsed.target7d ?? input.currentPrice,
    target30d:      parsed.target30d ?? input.currentPrice,
    riskLevel:      parsed.riskLevel ?? 'Medium',
    keyFactors:     parsed.keyFactors ?? [],
    technicals:     parsed.technicals ?? '',
    fundamentals:   parsed.fundamentals ?? '',
    recommendation: parsed.recommendation ?? 'Hold',
    confidence:     parsed.confidence ?? 50,
    generatedAt:    new Date().toISOString(),
  };
}