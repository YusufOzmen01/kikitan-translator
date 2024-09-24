export default async function translateGPT(text: string, source: string, target: string) {
    const res = await fetch(`https://kikitan-translator.onrender.com/translate/chatgpt?text=${text}&src=${source}&target=${target}`)

    if (res.status != 200) {
        throw new Error("Failed to translate")
    }

    return (await res.json()).text
}