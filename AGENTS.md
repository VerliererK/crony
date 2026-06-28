# Repository Guidelines

## 專案結構與模組組織

本專案是以 TypeScript 與 Hono 建構的 Cloudflare Workers 應用。

- `src/index.ts` 是 Worker 入口，負責 HTTP 路由與排程任務執行。
- `src/api/` 放置內建任務動作，例如 `jpy`、`freeios`。
- `src/lib/` 放置共用工具，例如 KV 存取與 fetch 輔助函式。
- `public/` 放置透過 Wrangler assets binding 服務的靜態檔案。
- `wrangler.jsonc` 設定 Worker、KV binding、assets 與 cron trigger。
- `worker-configuration.d.ts` 是 Wrangler 產生的 Cloudflare binding 型別檔。

## 建置、測試與開發指令

- `npm install`：安裝專案相依套件。
- `npm run dev`：啟動本機 Wrangler 開發伺服器。
- `npm run type-check`：使用 `tsc --noEmit` 執行 TypeScript 型別檢查。
- `npm run cf-typegen`：在 Wrangler 設定變更後重新產生 binding 型別。
- `npm run deploy`：以 minify 模式部署 Worker。

提交 TypeScript 變更前，請先執行 `npm run type-check`。若修改 bindings、vars、assets 或 compatibility 設定，請同步執行 `npm run cf-typegen`。

## 程式風格與命名慣例

使用 TypeScript ES modules，並維持 `strict` 模式可通過。請沿用既有風格：JSON 使用兩個空白縮排；TypeScript 使用分號、雙引號匯入與字串；函式保持短小且職責明確。變數與函式使用 `camelCase`，匯出型別使用 `PascalCase`，路由或動作名稱使用清楚的小寫名稱，例如 `freeios` 或 `jpy`。

共用邏輯應放在 `src/lib/`；特定動作的抓取與解析邏輯應放在 `src/api/`。

## 測試準則

目前尚未設定測試框架。現階段請以 `npm run type-check` 驗證型別，並在行為變更時透過 `npm run dev` 本機測試相關路由。若日後加入測試，建議使用 colocated `*.test.ts` 或 `src/**/*.test.ts` 命名模式，並優先覆蓋 KV 行為、job 篩選與 action 更新判斷。

## Commit 與 Pull Request 準則

近期歷史使用 Conventional Commits，例如 `feat(ui): add job management page`、`fix(scheduler): pass env to internal job requests`。請保持 commit 小而單一；範圍明確時使用 `type(scope): subject`。

Pull request 應包含簡短描述、驗證步驟、相關 issue 連結；若修改 `public/index.html` 或 UI 行為，請附上截圖或錄影。

## 安全與設定提醒

不要提交 secrets。敏感值請使用 Wrangler secrets，必要 binding 請記錄在 `wrangler.jsonc`。修改 `CRONY_KV` 的資料形狀時需格外謹慎，因為排程任務會依賴既有 job records。
