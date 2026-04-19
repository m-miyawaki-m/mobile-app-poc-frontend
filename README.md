# mobile-app-poc-frontend

Ionic + Vue + Capacitor によるモバイルアプリPoCのフロントエンド。
`mobile-app-poc-mock` の API に対してログイン + アイテムCRUD（一覧/作成/削除）を実装する。

## 位置づけ

- mobile-app-poc-api-spec
- mobile-app-poc-mock — 開発時の API 接続先
- **mobile-app-poc-frontend** ← 本リポジトリ
- mobile-app-poc-bridge — 別セッションで開発中、実装後に統合
- mobile-app-poc-backend — 別セッションで開発中、実装後に切替

## 前提

- Node.js `>=18` 必須（LTS 22.x 推奨）
- OS: Windows ネイティブ（PowerShell 前提）
- `git` CLI が PATH 上にあること（spec取得用）
- mock サーバーを別ターミナルで起動可能なこと
- 社内イントラネット内での運用のみ

## セットアップ

```powershell
npm install
npm run sync-spec
```

`npm run sync-spec` は以下を一括実行:
1. `./spec/` に api-spec を git clone（初回）または pull
2. `redocly bundle` で `spec/openapi.bundled.yaml` 生成
3. `openapi-typescript` で `src/api/generated/openapi.d.ts` 生成

## 開発起動

```powershell
npm run dev
```

→ Vite が `http://localhost:5173` で待ち受け。

別ターミナルで `mobile-app-poc-mock` を起動:

```powershell
cd ..\mobile-app-poc-mock
npm run mock
```

## 動作確認

ブラウザで `http://localhost:5173` を開く:

1. ログイン画面に遷移（`demo-user` / `demo-password` が初期値）
2. 「ログイン」 → JWT 取得 → アイテム一覧へ
3. サンプルアイテムA/B/C が表示される
4. 右下「+」で新規作成モーダル → name/quantity 入力 → 保存
5. アイテムを左スワイプ → 「削除」
6. 右上「ログアウト」 → ログイン画面に戻る

注: Prism モックは永続化しないため、新規作成・削除は次回の取得時には反映されません（PoC の想定通り）。

## 環境変数

`.env.development` で開発時の値を設定。`.env.example` を参考にしてください。

| 変数 | 用途 |
|---|---|
| `VITE_API_BASE` | API 接続先（mock=4010、backend=8080） |
| `VITE_LOGIN_USERNAME` | ログインフォーム初期値（PoC便宜） |
| `VITE_LOGIN_PASSWORD` | ログインフォーム初期値（PoC便宜） |

実機検証時は `.env.device` を作成し `VITE_API_BASE=http://<PC LAN IP>:4010` に。

## ディレクトリ構成

```
mobile-app-poc-frontend/
├─ scripts/sync-spec.mjs   # api-spec取得スクリプト
├─ spec/                   # api-spec取得物 + bundled.yaml（gitignored）
├─ src/
│  ├─ api/                 # CapacitorHttp ラッパー + 型生成物
│  ├─ stores/              # Pinia stores (auth, items)
│  ├─ views/               # 画面コンポーネント
│  ├─ router/              # Vue Router 設定
│  ├─ theme/variables.css  # Ionic CSS 変数
│  ├─ App.vue
│  └─ main.ts
├─ .env.development
└─ package.json
```

## ビルド

```powershell
npm run build
```

→ `vue-tsc` で型チェック後、`vite build` で `dist/` に出力。

## Android プラットフォーム追加（参考）

実機検証段階で対応:

```powershell
npm install @capacitor/android
npx cap add android
# .env.device 作成 (VITE_API_BASE=http://<PC LAN IP>:4010)
npm run build
npx cap sync android
npx cap open android        # Android Studio 起動
# または
npx cap run android --livereload  # 実機 Live Reload
```

ファイアウォールで mock の 4010 を許可、mock も `npm run mock:lan` で起動すること。

## backend 接続切替（実装後）

`.env.production` を作成し `VITE_API_BASE=http://<backend host>:8080` に変更。
`npm run build -- --mode production` で本番ビルド。

## bridge 連携追加（実装後）

`mobile-app-poc-bridge` 完成後、本リポジトリに追加手順を記載予定。
基本フロー: bridge を npm install (git URL or local file) → import → 呼び出し。

## トラブルシュート

| 症状 | 対処 |
|---|---|
| `npm install` で実行ポリシーエラー | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` |
| `npm run sync-spec` 失敗 | git CLI が PATH にあるか、リポジトリURLにアクセス可能か |
| `Cannot find module '@/api/generated/openapi'` | `npm run sync-spec` 未実行。型生成からやり直す |
| ログインで CORS エラー | mock 側で CORS 有効か（Prism は既定で `*` を返す） |
| ブラウザで CapacitorHttp 動作しない | Web では fetch にフォールバック。mock 側のCORS確認 |
| アイテム一覧が空のまま | mock が起動しているか、`VITE_API_BASE` が正しいか |