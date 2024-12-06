# Kikitan Translator

<div align="center">
<a href="https://sergiomarquina.booth.pm/items/6073050">
<img src="https://media.buyee.jp/guide/addtobuyee/assets/img/store-logo-booth.png" alt="drawing" width="150" align="center">
</a>
<a href="https://buymeacoffee.com/sergiomarquina">
<img src="https://i.imgur.com/l7NBjqk.png" alt="drawing" width="150" height="45" align="center">
</a>
<br><br>
<img src="https://i.imgur.com/RQlgF0N.png" />
</div>

### A VRChat translator built for helping you and the person/people you're talking with to understand each other regardless of language differences.

- **Translation:** Translation of your speech to the chatbox in more than 10 major languages (6 accents of English and 6 dialects of Spanish along with languages such as Japanese, Korean, Chinese, Italian, French, Turkish, Russian, Polish, Portugal, German, French, Arabic, Swedish and so on)
- **Transcription (Just Speech to Text):** If you don't want to translate, there is a transcription mode that sends whatever you say directly to the chatbox. Perfect for people that prefer to not speak in VRChat but be able to communicate with the convenience of speaking.
- **SteamVR Speech to Text:** Similar to transcription mode, you can use this application to use Speech to Text while controlling your computer through SteamVR. Instead of writing using the SteamVR keyboard, you can hold any button while aiming at the screen to send keystrokes of whatever you say. Make sure to enable "SteamVR Connection" in Kikitan. **Still a bit experimental**

## How to build

### Required dependencies

- rust (recommended minimum is 1.77.2)
- node (recommended minimum is v22.1.0)

```sh
git clone https://github.com/YusufOzmen01/kikitan-translator
cd kikitan-translator

# to update dependencies
npm i

# for development
npm run tauri dev

# signing is required if you want to use the updater
# if don't want to use the updater, delete the updater plugin inside of tauri.conf.json

# to sign the executable, generate a private and public keypair, then assign TAURI_SIGNING_PRIVATE_KEY environment variable and update the pubkey field inside of tauri.conf.json with your public key

# for compiling as a release build
npm run tauri build
```

## License

[Check the LICENSE.md for details](https://github.com/YusufOzmen01/kikitan-translator/blob/main/LICENSE.md)
