import { CapacitorHttp } from '@capacitor/core';
import { StockData, CachedData } from '../types';

const CACHE_KEY_PREFIX = 'stock_cache_';
const CACHE_TTL = 24 * 60 * 60 * 1000;
let lastError = '';

// 后端 API 地址 — 本地开发用 localhost，局域网用本机 IP
const API_BASE = (() => {
  // Capacitor 原生平台：用局域网 IP
  try {
    if ((window as any).Capacitor?.isNativePlatform?.()) {
      // 在 Android WebView 中，10.0.2.2 映射到宿主机 localhost
      return 'http://10.0.2.2:8765';
    }
  } catch {}
  // 浏览器：用当前 hostname
  const host = window.location.hostname || 'localhost';
  return `http://${host}:8765`;
})();

export function getLastError(): string { return lastError; }

function isNative(): boolean {
  try { return !!(window as any).Capacitor?.isNativePlatform?.(); } catch { return false; }
}

function getCacheKey(s: string) { return `${CACHE_KEY_PREFIX}${s}`; }

export function getCachedData(symbol: string): StockData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(symbol));
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    return Date.now() - cached.timestamp > CACHE_TTL ? null : cached.data;
  } catch { return null; }
}

function setCachedData(symbol: string, data: StockData): void {
  try { localStorage.setItem(getCacheKey(symbol), JSON.stringify({ data, timestamp: Date.now() })); } catch {}
}

async function httpGet(url: string): Promise<any> {
  if (isNative()) {
    const resp = await CapacitorHttp.get({ url, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (resp.status >= 200 && resp.status < 300) return resp.data;
    throw new Error(`HTTP ${resp.status}`);
  }
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

export async function fetchStockData(symbol: string): Promise<StockData> {
  lastError = '';
  try {
    const data = await httpGet(`${API_BASE}/api/quote?symbols=${encodeURIComponent(symbol)}`);
    const r = data?.stocks?.[0];
    if (!r || !r.price) { lastError = '无数据: ' + symbol; return emptyStock(symbol); }

    const stock: StockData = {
      symbol: r.symbol ?? symbol,
      name: r.name ?? symbol,
      price: r.price ?? 0,
      currency: r.currency ?? 'USD',
      forwardPE: r.forwardPE ?? null,
      trailingPE: r.trailingPE ?? null,
      pegRatio: r.pegRatio ?? null,
      revenueGrowth: r.revenueGrowth ?? null,
      grossMargin: r.grossMargin ?? null,
      profitMargin: r.profitMargin ?? null,
      marketCap: r.marketCap ?? null,
      fiftyTwoWeekHigh: r.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: r.fiftyTwoWeekLow ?? null,
    };
    if (stock.price > 0) setCachedData(symbol, stock);
    return stock;
  } catch (e: any) {
    lastError = e.message ?? String(e);
    return emptyStock(symbol);
  }
}

function emptyStock(symbol: string): StockData {
  return { symbol, name: symbol, price: 0, currency: 'USD', forwardPE: null, trailingPE: null, pegRatio: null, revenueGrowth: null, grossMargin: null, profitMargin: null, marketCap: null, fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null };
}

export async function fetchMultiStocks(symbols: string[]): Promise<StockData[]> {
  lastError = '';
  // 后端支持批量查询：/api/quote?symbols=AAPL,TSLA,MSFT
  try {
    const joined = symbols.map(s => s.trim()).filter(Boolean).join(',');
    const data = await httpGet(`${API_BASE}/api/quote?symbols=${encodeURIComponent(joined)}`);
    const stocks: StockData[] = (data?.stocks ?? []).map((r: any) => ({
      symbol: r.symbol ?? '',
      name: r.name ?? r.symbol ?? '',
      price: r.price ?? 0,
      currency: r.currency ?? 'USD',
      forwardPE: r.forwardPE ?? null,
      trailingPE: r.trailingPE ?? null,
      pegRatio: r.pegRatio ?? null,
      revenueGrowth: r.revenueGrowth ?? null,
      grossMargin: r.grossMargin ?? null,
      profitMargin: r.profitMargin ?? null,
      marketCap: r.marketCap ?? null,
      fiftyTwoWeekHigh: r.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: r.fiftyTwoWeekLow ?? null,
    }));
    // 缓存
    stocks.forEach(s => { if (s.price > 0) setCachedData(s.symbol, s); });
    return stocks.filter(r => r.price > 0);
  } catch (e: any) {
    lastError = e.message ?? String(e);
    // fallback: 逐个查询
    const results = await Promise.all(symbols.map(s => fetchStockData(s)));
    return results.filter(r => r.price > 0);
  }
}

export async function searchStock(query: string): Promise<{ symbol: string; name: string }[]> {
  try {
    const data = await httpGet(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`);
    return data?.results ?? [];
  } catch {
    return [];
  }
}
