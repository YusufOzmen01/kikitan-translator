# Kikitan Translator
[English](https://github.com/YusufOzmen01/kikitan-translator)/[日本語](https://github.com/YusufOzmen01/kikitan-translator/blob/main/README_jp.md)

### 言語の違いに関係なく、お互いを理解するために作られたVRChatの翻訳アプリ。

- **VRChat翻訳:** Google ScriptsのMLベースの翻訳APIおよびGoogle翻訳のサポート (DeepL、ChatGPT、Bingのサポートは近日公開予定)
- **SteamVR音声テキスト入力 (日本語と併用すると壊れる場合があります):** アプリが受信した音声認識データを使用して、SteamVRでデスクトップに焦点を当てながらA/Yボタンを押すことで、アプリが話した内容を画面に入力できます。

## 使い方
[Kikitan Translatorをダウンロード](https://github.com/YusufOzmen01/kikitan-translator/releases)

## ビルド方法

RustとNode.jsがインストールされていることを確認してください

```sh
git clone https://github.com/YusufOzmen01/kikitan-translator
cd kikitan-translator

# 開発用
npm run tauri dev

# ビルドする場合
# tauri.conf.json内のpublickeyを変更し、TAURI_PRIVATE_KEYとTAURI_KEY_PASSWORD環境変数を割り当てることを確認してください（これらの生成方法についてはtauriのwikiを参照してください）

npm run tauri build
```

# ライセンス

Kikitan Translatorはフリーソフトウェアです：あなたはそれを再配布したり、変更したりできます
これは、GNU一般公衆利用許諾契約の条件の下で、
Free Software Foundationによって公開されています。許諾されるバージョン3、または
（あなたの選択により）以降のバージョン。

Kikitan Translatorは、有用であることを願っていますが、
いかなる保証もありません。黙示された保証もありません。
特定の目的への商品性や適合性もありません。 [詳細については、
GNU一般公衆利用許諾契約書をご覧ください。](https://www.gnu.org/licenses/gpl-3.0.ja.html)