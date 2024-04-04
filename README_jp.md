# Kikitan Translator
[English](https://github.com/YusufOzmen01/kikitan-translator)/[日本語](https://github.com/YusufOzmen01/kikitan-translator/blob/main/README_jp.md)

[<img src="https://i.imgur.com/dC3XcKV.png)" alt="drawing" width="150"/>](https://github.com/yusufozmen01/kikitan-translator/releases/download/latest/Kikitan.Translator_x64-setup.exe)

### 言語の違いに関係なく、お互いを理解するために作られたVRChatの翻訳アプリ。

- **VRChat翻訳:** Google ScriptsのMLベースの翻訳APIおよびGoogle翻訳のサポート (DeepL、ChatGPT、Bingのサポートは近日公開予定)
- **SteamVR音声テキスト入力 (日本語と併用すると壊れる場合があります):** SteamVRでデスクトップに焦点を当てながらA/Yボタンを押すことで、画面上に音声でテキスト入力ができます。

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

Kikitan Translator はフリー ソフトウェアです。
Free Software Foundation が発行する GNU General Public License の条件 (バージョン 3 のライセンス、または (お客様の選択によって) それ以降のバージョン) に基づいて再配布や改変が可能です。

Kikitan Translatorは、有用であることを願って配布していますが、いかなる保証もありません。商品性や特定の目的への適合性についての暗黙の保証もありません。[詳細については、GNU一般公衆利用許諾契約書をご覧ください](https://www.gnu.org/licenses/gpl-3.0.ja.html)
