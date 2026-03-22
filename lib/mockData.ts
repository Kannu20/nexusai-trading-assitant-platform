// ============================================================
// lib/mockData.ts — All mock data for the platform
// ============================================================

export type Asset = {
  id: string;
  name: string;
  symbol: string;
  category: 'stock' | 'commodity' | 'crypto';
  price: number;
  change: number;       // % change 24h
  changeAbs: number;    // absolute $ change
  volume: string;
  marketCap: string;
  high24h: number;
  low24h: number;
  sparkline: number[];  // 7 data points for mini chart
};

export type PortfolioItem = {
  id: string;
  assetId: string;
  name: string;
  symbol: string;
  amount: number;       // USD invested
  units: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
  color: string;
};

export type Alert = {
  id: string;
  type: 'price' | 'risk' | 'news';
  asset: string;
  message: string;
  time: string;
  read: boolean;
  severity: 'low' | 'medium' | 'high';
};

// ── Assets ──────────────────────────────────────────────────
export const ASSETS: Asset[] = [
  {
    id: 'gold',
    name: 'Gold',
    symbol: 'XAU/USD',
    category: 'commodity',
    price: 2341.50,
    change: 1.24,
    changeAbs: 28.70,
    volume: '$42.3B',
    marketCap: '$14.5T',
    high24h: 2358.90,
    low24h: 2310.20,
    sparkline: [2280, 2295, 2310, 2290, 2320, 2338, 2341],
  },
  {
    id: 'silver',
    name: 'Silver',
    symbol: 'XAG/USD',
    category: 'commodity',
    price: 29.48,
    change: 2.17,
    changeAbs: 0.63,
    volume: '$8.1B',
    marketCap: '$1.6T',
    high24h: 30.10,
    low24h: 28.80,
    sparkline: [27.5, 27.9, 28.4, 28.9, 29.1, 29.3, 29.48],
  },
  {
    id: 'crude-oil',
    name: 'Crude Oil',
    symbol: 'WTI/USD',
    category: 'commodity',
    price: 78.34,
    change: -0.83,
    changeAbs: -0.66,
    volume: '$31.7B',
    marketCap: 'N/A',
    high24h: 79.50,
    low24h: 77.80,
    sparkline: [80.5, 79.8, 79.2, 78.9, 78.5, 78.6, 78.34],
  },
  {
    id: 'copper',
    name: 'Copper',
    symbol: 'HG/USD',
    category: 'commodity',
    price: 4.52,
    change: 0.89,
    changeAbs: 0.04,
    volume: '$3.4B',
    marketCap: 'N/A',
    high24h: 4.58,
    low24h: 4.46,
    sparkline: [4.38, 4.41, 4.45, 4.43, 4.47, 4.50, 4.52],
  },
  {
    id: 'aapl',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    category: 'stock',
    price: 189.30,
    change: 1.52,
    changeAbs: 2.84,
    volume: '$6.2B',
    marketCap: '$2.94T',
    high24h: 190.40,
    low24h: 186.90,
    sparkline: [182, 184, 185, 183, 186, 188, 189.3],
  },
  {
    id: 'msft',
    name: 'Microsoft',
    symbol: 'MSFT',
    category: 'stock',
    price: 415.20,
    change: 0.74,
    changeAbs: 3.05,
    volume: '$4.1B',
    marketCap: '$3.09T',
    high24h: 416.80,
    low24h: 411.50,
    sparkline: [405, 408, 410, 409, 412, 414, 415.2],
  },
  {
    id: 'nvda',
    name: 'NVIDIA',
    symbol: 'NVDA',
    category: 'stock',
    price: 875.40,
    change: 3.21,
    changeAbs: 27.20,
    volume: '$18.9B',
    marketCap: '$2.15T',
    high24h: 882.10,
    low24h: 845.30,
    sparkline: [820, 835, 845, 855, 860, 870, 875.4],
  },
  {
    id: 'tsla',
    name: 'Tesla',
    symbol: 'TSLA',
    category: 'stock',
    price: 178.90,
    change: -2.14,
    changeAbs: -3.91,
    volume: '$9.8B',
    marketCap: '$568B',
    high24h: 184.20,
    low24h: 177.50,
    sparkline: [190, 188, 185, 183, 182, 180, 178.9],
  },
];

// ── Dashboard featured assets (subset) ──────────────────────
export const DASHBOARD_ASSETS = ASSETS.filter((a) =>
  ['gold', 'silver', 'crude-oil', 'copper', 'aapl'].includes(a.id)
);

// ── Portfolio items ──────────────────────────────────────────
export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 'p1',
    assetId: 'gold',
    name: 'Gold',
    symbol: 'XAU/USD',
    amount: 15000,
    units: 6.41,
    currentValue: 15009.50,
    gainLoss: 9.50,
    gainLossPct: 0.06,
    color: '#ffaa00',
  },
  {
    id: 'p2',
    assetId: 'aapl',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    amount: 10000,
    units: 52.9,
    currentValue: 10014.57,
    gainLoss: 14.57,
    gainLossPct: 0.15,
    color: '#00d4ff',
  },
  {
    id: 'p3',
    assetId: 'crude-oil',
    name: 'Crude Oil',
    symbol: 'WTI/USD',
    amount: 8000,
    units: 102.1,
    currentValue: 7994.21,
    gainLoss: -5.79,
    gainLossPct: -0.07,
    color: '#9966ff',
  },
  {
    id: 'p4',
    assetId: 'nvda',
    name: 'NVIDIA',
    symbol: 'NVDA',
    amount: 12000,
    units: 13.71,
    currentValue: 12002.14,
    gainLoss: 2.14,
    gainLossPct: 0.02,
    color: '#00ff88',
  },
];

// ── Portfolio chart history (30-day) ────────────────────────
export const PORTFOLIO_HISTORY = Array.from({ length: 30 }, (_, i) => ({
  day: `Day ${i + 1}`,
  value: 43000 + Math.sin(i * 0.4) * 1800 + i * 120 + Math.random() * 500,
}));

// ── Alerts ───────────────────────────────────────────────────
export const ALERTS: Alert[] = [
  {
    id: 'a1',
    type: 'price',
    asset: 'Gold',
    message: 'Gold has crossed the $2,340 resistance level.',
    time: '2 min ago',
    read: false,
    severity: 'high',
  },
  {
    id: 'a2',
    type: 'risk',
    asset: 'NVDA',
    message: 'NVIDIA volatility index elevated above 35 — consider hedging.',
    time: '18 min ago',
    read: false,
    severity: 'medium',
  },
  {
    id: 'a3',
    type: 'price',
    asset: 'Crude Oil',
    message: 'WTI Crude dipped below $79 support — bearish signal.',
    time: '45 min ago',
    read: true,
    severity: 'medium',
  },
  {
    id: 'a4',
    type: 'news',
    asset: 'Silver',
    message: 'Industrial demand for Silver expected to rise 12% in Q3.',
    time: '2h ago',
    read: true,
    severity: 'low',
  },
  {
    id: 'a5',
    type: 'risk',
    asset: 'Portfolio',
    message: 'Portfolio correlation risk increased — diversification score dropped.',
    time: '4h ago',
    read: true,
    severity: 'high',
  },
];

// ── AI mock responses ────────────────────────────────────────
export const AI_RESPONSES: Record<string, string> = {
  default:
    "Based on current market conditions, I'm analyzing your query. The multi-asset correlation matrix shows **medium systemic risk** with elevated volatility in commodities sector. Consider rebalancing toward defensive assets if your risk tolerance is conservative.",
  gold:
    "**Gold (XAU/USD)** is displaying a classic **bullish continuation pattern** — trading above the 200-day MA at $2,290. Key resistance at $2,360. **Medium risk** with upside target of $2,420 by Q3. Central bank buying and geopolitical tensions support the bullish thesis. Recommended allocation: 15-20% of commodity exposure.",
  silver:
    "**Silver (XAG/USD)** shows a **dual demand dynamic** — both safe-haven and industrial demand are rising. Solar panel adoption is driving structural demand growth. Current momentum is positive with RSI at 62 (not yet overbought). **Low-to-medium risk**. Target: $32 over 3 months.",
  oil:
    "**WTI Crude Oil** faces headwinds from potential demand slowdown in Asia. Supply cuts from OPEC+ provide a floor around $76. Short-term outlook: **neutral to bearish**. **High risk** — energy markets remain geopolitically sensitive. Watch for EIA inventory data this Wednesday.",
  portfolio:
    "Your portfolio shows a **diversification score of 68/100**. Concentration risk in tech (NVDA + AAPL = 48% of equity exposure) warrants attention. Recommended action: add commodity exposure via Copper or Silver to improve the score. Current **risk level: Medium**.",
  crash:
    "Stress-testing your portfolio against a **20% market crash scenario**: estimated drawdown of **$9,200 (−21.4%)**. Gold and Silver positions act as partial hedges, limiting losses vs. an all-equity portfolio. Consider adding 5-10% in short-duration bonds to further reduce drawdown risk.",
};

// ── Simulator data ───────────────────────────────────────────
export const generateSimulatorData = (
  interestRate: number,
  crashPct: number
) => {
  const base = 45020;
  const rateImpact = -interestRate * 800;
  const crashImpact = -(crashPct / 100) * base;
  const newValue = Math.max(base + rateImpact + crashImpact, 5000);

  return {
    baseValue: base,
    newValue: Math.round(newValue),
    change: Math.round(newValue - base),
    changePct: (((newValue - base) / base) * 100).toFixed(2),
    chartData: Array.from({ length: 12 }, (_, i) => ({
      month: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][i],
      baseline: Math.round(base + i * 200 + Math.sin(i * 0.5) * 400),
      simulated: Math.round(
        Math.max(base + rateImpact * (i / 11) + crashImpact * (i / 11) + i * 100, 5000)
      ),
    })),
  };
};
