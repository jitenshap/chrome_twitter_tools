# X User All Redirect

`x.com` のユーザーページを見やすい URL に自動補正する Chrome 拡張です。

## 主な機能

- ユーザーページ直下を `/all` 付きで開きます。
  - `https://x.com/MEMchro` -> `https://x.com/MEMchro/all`
- メディア欄に `filter=all` を付与します。
  - `https://x.com/hoppou_erika/media` -> `https://x.com/hoppou_erika/media?filter=all`
- メディア欄は `filter=all` 付与後に 1 回 reload します。
  - X 側の内部タブ状態が「動画」のまま残ることを避けるためです。
- X 内のページ遷移後に `webNavigation` と content script で補正します。
  - URL だけでなく表示内容も切り替わるよう、明示的に再遷移します。
- ページタイトル末尾の ` / X` を ` / Twitter` に置き換えます。
  - `ホーム / X` -> `ホーム / Twitter`
  - この機能はオプション画面でオン/オフできます。

## インストール方法

1. このリポジトリを clone または ZIP ダウンロードします。
2. Chrome で `chrome://extensions/` を開きます。
3. 右上の「デベロッパー モード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」を押します。
5. このリポジトリのフォルダーを選択します。

更新したコードを反映するときは、`chrome://extensions/` でこの拡張のリロードボタンを押し、開いている X のタブもリロードしてください。

## オプション

拡張の詳細画面から「拡張機能のオプション」を開くと、タイトル置換機能をオン/オフできます。

初期値はオンです。

## 必要な権限

- `storage`
  - タイトル置換のオン/オフ設定を保存するために使います。
- `webNavigation`
  - X 内の SPA ページ遷移を検知し、必要な URL 補正を行うために使います。
- `https://x.com/*`
  - X 上でのみ content script と URL 補正処理を動かすために使います。

## 動作確認の例

拡張を読み込んだあと、以下を確認してください。

- `https://x.com/MEMchro` を開くと `/all` が付く
- X の検索サジェストなどからユーザーページへ移動しても `/all` が付く
- `https://x.com/hoppou_erika/media` を開くと `?filter=all` が付く
- X 内のリンクからメディア欄へ移動しても `?filter=all` が付き、メディア欄の表示に切り替わる
- `ホーム / X` などのページタイトルが `ホーム / Twitter` になる

## ファイル構成

- `manifest.json`
  - Chrome 拡張の定義ファイルです。
- `background.js`
  - `webNavigation` を使って、ページ遷移後の URL を補正します。
- `content.js`
  - X のページ上で現在 URL の補正、タイトル置換を行います。
- `page-router.js`
  - X 本体の SPA ルーターに近い位置で `history.pushState` / `replaceState` を検知します。
- `options.html`, `options.css`, `options.js`
  - タイトル置換設定のオプション画面です。

## 開発メモ

この拡張はビルド不要です。ファイルを編集したら Chrome の拡張管理画面でリロードしてください。

構文チェックの例:

```powershell
node --check background.js
node --check content.js
node --check page-router.js
node --check options.js
```

## ライセンス

なんでもいいです
