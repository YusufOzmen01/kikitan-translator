# Kikitan Translator
[English](https://github.com/YusufOzmen01/kikitan-translator)/[日本語](https://github.com/YusufOzmen01/kikitan-translator/blob/main/README_jp.md)

[<img src="https://i.imgur.com/dC3XcKV.png)" alt="drawing" width="150"/>](https://github.com/yusufozmen01/kikitan-translator/releases/latest/download/Kikitan.Translator_x64-setup.exe)

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

[詳細については LICENSE.md をご確認ください。](https://github.com/YusufOzmen01/kikitan-translator/blob/main/LICENSE.md)