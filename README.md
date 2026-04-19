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

## Android 実機検証

`@capacitor/android` 導入済み、`android/` 初期化済み。以下の手順で実機にインストール可能。

### 前提

- **Android Studio** インストール済み（SDK + Build Tools 含む）
- **JDK 17+**（Capacitor 6.x 推奨）
- 実機（USBデバッグON）または Android エミュレータ
- PC とスマホが**同じ LAN** にいる
- mock サーバーが PC で起動中

### 1. PC の LAN IP を確認

```powershell
ipconfig | Select-String "IPv4"
```

例: `192.168.1.10`

### 2. `.env.device` を作成

`.env.device.example` をコピーして `<PCのLAN_IP>` を実値に置換:

```
VITE_API_BASE=http://192.168.1.10:4010
VITE_LOGIN_USERNAME=demo-user
VITE_LOGIN_PASSWORD=demo-password
```

### 3. mock を LAN 公開モードで起動

`mobile-app-poc-mock` 側のターミナルで:
```powershell
npm run mock:lan
```

→ `http://0.0.0.0:4010` で待ち受け。Windowsファイアウォールで 4010 ポートの受信許可必要。

### 4. PC のファイアウォール許可（コマンド例）

```powershell
New-NetFirewallRule -DisplayName "Prism mock 4010" -Direction Inbound -LocalPort 4010 -Protocol TCP -Action Allow
```

別端末から `http://<PCのIP>:4010/items` が応答するか curl/ブラウザで確認しておくと切り分けが楽。

### 5. ビルド + Android プロジェクトに同期

```powershell
npm run android:sync
```

→ 内部で `vue-tsc` 型チェック → `vite build` → `npx cap sync android` を実行。`android/app/src/main/assets/public/` に最新成果物がコピーされる。

### 6. Android Studio で開く / 実機で実行

```powershell
npm run android:open       # Android Studio で開く（▶ Run でビルド・転送）
# または
npm run android:run        # CLI で USB接続実機に直接インストール
```

### 7. Live Reload（開発中）

ビルドし直さずコード変更を即反映:

```powershell
npm run android:livereload
```

→ Capacitor が `--external` で PC の Vite を実機に見せる。Vite のポート 5173 も Windowsファイアウォール許可必要。

### トラブル切り分け

| 症状 | 確認事項 |
|---|---|
| 実機でアプリは開くが API に繋がらない | `.env.device` の IP が PC の現在のIPと一致しているか / mock が `mock:lan` で起動しているか / 同じ Wi-Fi か |
| `gradle sync failed` 等 | JDK バージョン（17推奨） / Android SDK パス設定 |
| Live Reload で繋がらない | Vite のポート 5173 もファイアウォール許可、ipconfigでIP再確認 |
| HTTPS必須エラー | Capacitor 6 + Android で http 通信に追加設定が必要。`capacitor.config.ts` の `server.cleartext: true` を検討 |

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