// ============================================================
// lib/store.ts — Zustand global state management
// ============================================================

import { create } from 'zustand';
import { PORTFOLIO_ITEMS, ALERTS, type PortfolioItem, type Alert } from './mockData';

interface PortfolioState {
  items: PortfolioItem[];
  addItem: (item: PortfolioItem) => void;
  removeItem: (id: string) => void;
}

interface AlertState {
  alerts: Alert[];
  priceAlertsEnabled: boolean;
  riskAlertsEnabled: boolean;
  markRead: (id: string) => void;
  togglePriceAlerts: () => void;
  toggleRiskAlerts: () => void;
  addAlert: (alert: Alert) => void;
}

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

// ── Portfolio store ──────────────────────────────────────────
export const usePortfolioStore = create<PortfolioState>((set) => ({
  items: PORTFOLIO_ITEMS,
  addItem: (item) =>
    set((s) => ({ items: [...s.items, item] })),
  removeItem: (id) =>
    set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
}));

// ── Alert store ──────────────────────────────────────────────
export const useAlertStore = create<AlertState>((set) => ({
  alerts: ALERTS,
  priceAlertsEnabled: true,
  riskAlertsEnabled: true,
  markRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    })),
  togglePriceAlerts: () =>
    set((s) => ({ priceAlertsEnabled: !s.priceAlertsEnabled })),
  toggleRiskAlerts: () =>
    set((s) => ({ riskAlertsEnabled: !s.riskAlertsEnabled })),
  addAlert: (alert) =>
    set((s) => ({ alerts: [alert, ...s.alerts] })),
}));

// ── Sidebar store ────────────────────────────────────────────
export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
}));
