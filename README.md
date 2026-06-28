# crony

`crony` 是一個以 Cloudflare Workers 與 Hono 建構的排程任務服務，用來定期執行內建或自訂的 job。

## 功能

- 透過 Cloudflare cron trigger 每分鐘檢查已啟用的 jobs。
- 支援內建 action routes，例如 `/jpy`、`/freeios`。
- 使用 Cloudflare KV 儲存 job 設定與 action 狀態。
- 可透過靜態頁面管理 jobs。

## 開發

```txt
npm install
npm run dev
```

啟動本機開發伺服器後，可使用 Wrangler 提供的本機位址測試 Worker。

執行型別檢查：

```txt
npm run type-check
```

## 部署

Wrangler 設定變更後，先同步 Cloudflare binding 型別：

```txt
npm run cf-typegen
```

部署 Worker：

```txt
npm run deploy
```

## 設定

`wrangler.jsonc` 需要設定 `CRONY_KV` binding，供排程任務儲存 jobs 與 action 狀態。

使用 Wrangler CLI 建立 KV namespace：

```txt
npx wrangler kv namespace create CRONY_KV
```

建立後，將 CLI 輸出的 `id` 填入 `wrangler.jsonc`：

```jsonc
"kv_namespaces": [
  {
    "binding": "CRONY_KV",
    "id": "your-kv-namespace-id"
  }
]
```

## 通知

支援透過 NTFY 發送通知，可用 Wrangler secret 設定 topic URL：

```txt
npx wrangler secret put NTFY_TOPIC_URL
```

敏感資訊請使用 Wrangler secrets，不要提交到版本庫。
