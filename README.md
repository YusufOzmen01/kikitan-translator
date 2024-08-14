# Kikitan Translator
<div align="center">
<a href="https://github.com/YusufOzmen01/kikitan-translator">English</a>/<a href="https://github.com/YusufOzmen01/kikitan-translator/blob/main/README_jp.md">日本語</a>

<img src="https://i.imgur.com/RQlgF0N.png" />
<a href="https://github.com/yusufozmen01/kikitan-translator/releases/latest/download/Kikitan.Translator_x64-setup.exe">
<img src="https://i.imgur.com/50XNWwG.png)" alt="drawing" width="150" align="center">
</a>
</div>

### A VRChat translator built for helping you and the person/people you're talking with to understand each other regardles of language differences.

- **VRChat Translation:** Support for using Google Translate (support for DeepL, ChatGPT and Bing soon)
- **SteamVR Speech to Text Input:** Using the speech recognition data that the app received, you can hold your A/Y button while focused on your desktop in SteamVR to let the app type whatever you said to the screen.


## How to build

Make sure to have rust and nodejs installed

```sh
git clone https://github.com/YusufOzmen01/kikitan-translator
cd kikitan-translator

# for development
npm run tauri dev

# to build
# make sure to change the publickey inside of tauri.conf.json and assign TAURI_SIGNING_PRIVATE_KEY and TAURI_KEY_PASSWORD environment variables (you can look up on how to generate those in tauri's wiki)

npm run tauri build
```

## License

[Check the LICENSE.md for details](https://github.com/YusufOzmen01/kikitan-translator/blob/main/LICENSE.md)
