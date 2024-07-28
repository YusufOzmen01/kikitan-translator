# Kikitan Translator
[English](https://github.com/YusufOzmen01/kikitan-translator)/[日本語](https://github.com/YusufOzmen01/kikitan-translator/blob/main/README_jp.md)

[<img src="https://i.imgur.com/Kwg5nf8.png)" alt="drawing" width="150"/>](https://github.com/yusufozmen01/kikitan-translator/releases/download/latest/Kikitan.Translator_x64-setup.exe)

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
# make sure to change the publickey inside of tauri.conf.json and assign TAURI_PRIVATE_KEY and TAURI_KEY_PASSWORD environment variables (you can look up on how to generate those in tauri's wiki)

npm run tauri build
```

## License

Kikitan Translator is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Kikitan Translator is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
[GNU General Public License for more details.](https://www.gnu.org/licenses/gpl-3.0.en.html)

