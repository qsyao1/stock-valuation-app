"""
股票估值追踪 — 后端 API 服务
使用 yfinance 获取实时股票数据，暴露 REST API 供 App 调用

启动方式：
  python3 server.py
  # 或指定端口：
  # PORT=8765 python3 server.py
"""
import json
import os
import time
import socket
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import yfinance as yf
from yfinance.search import Search

PORT = int(os.environ.get("PORT", 8765))
CACHE = {}
CACHE_TTL = 300  # 5 分钟缓存


def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def fetch_stock(symbol):
    """获取单只股票数据（带缓存）"""
    key = symbol.upper()
    now = time.time()
    if key in CACHE and now - CACHE[key]["ts"] < CACHE_TTL:
        return CACHE[key]["data"]

    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        hist = ticker.history(period="5d")

        price = 0
        currency = "USD"
        if len(hist) >= 1:
            price = float(hist["Close"].iloc[-1])
            currency = info.get("currency", "USD")

        data = {
            "symbol": symbol.upper(),
            "name": info.get("shortName") or info.get("longName") or symbol,
            "price": price,
            "currency": currency,
            "forwardPE": _safe_float(info.get("forwardPE")),
            "trailingPE": _safe_float(info.get("trailingPE")),
            "pegRatio": _safe_float(info.get("pegRatio")),
            "revenueGrowth": _safe_float(info.get("revenueGrowth")),
            "grossMargin": _safe_float(info.get("grossMargins")),
            "profitMargin": _safe_float(info.get("profitMargins")),
            "marketCap": _safe_float(info.get("marketCap")),
            "fiftyTwoWeekHigh": _safe_float(info.get("fiftyTwoWeekHigh")),
            "fiftyTwoWeekLow": _safe_float(info.get("fiftyTwoWeekLow")),
        }
        CACHE[key] = {"ts": now, "data": data}
        return data
    except Exception:
        # 返回缓存中的过期数据作为 fallback
        if key in CACHE:
            return CACHE[key]["data"]
        raise


def search_stocks(query):
    """搜索股票"""
    try:
        s = Search(query)
        results = []
        for q in (s.quotes or [])[:8]:
            sym = q.get("symbol", "")
            name = q.get("shortname") or q.get("longname") or sym
            if sym:
                results.append({"symbol": sym, "name": name})
        if results:
            return results
    except Exception:
        pass
    # fallback: 直接尝试 ticker
    try:
        ticker = yf.Ticker(query)
        info = ticker.info
        name = info.get("shortName") or info.get("longName")
        if name:
            return [{"symbol": query.upper(), "name": name}]
    except Exception:
        pass
    return []


def _safe_float(val):
    if val is None:
        return None
    try:
        v = float(val)
        return v if v != 0 else None
    except (ValueError, TypeError):
        return None


class Handler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send_json({})

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        params = parse_qs(parsed.query)

        try:
            if path == "/api/quote":
                symbols = params.get("symbols", [""])[0]
                if not symbols:
                    self._send_json({"error": "缺少 symbols 参数"}, 400)
                    return
                results = []
                for s in symbols.split(","):
                    s = s.strip()
                    if s:
                        results.append(fetch_stock(s))
                self._send_json({"stocks": results})

            elif path == "/api/search":
                q = params.get("q", [""])[0]
                if not q:
                    self._send_json({"results": []})
                    return
                results = search_stocks(q)
                self._send_json({"results": results})

            elif path == "/api/health":
                self._send_json({"status": "ok", "ip": get_local_ip()})

            elif path == "/" or path == "":
                self._send_json({"service": "stock-valuation-api", "status": "running", "endpoints": ["/api/quote", "/api/search", "/api/health"]})

            else:
                self._send_json({"error": "Not found"}, 404)

        except Exception as e:
            self._send_json({"error": str(e)}, 500)

    def log_message(self, format, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {args[0]}")


def main():
    ip = get_local_ip()
    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"\n  📊 股票估值追踪 API 服务")
    print(f"  地址: http://{ip}:{PORT}")
    print(f"  示例: http://{ip}:{PORT}/api/quote?symbols=AAPL,TSLA")
    print(f"  搜索: http://{ip}:{PORT}/api/search?q=Apple")
    print(f"\n  按 Ctrl+C 停止\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  服务已停止")
        server.shutdown()


if __name__ == "__main__":
    main()
