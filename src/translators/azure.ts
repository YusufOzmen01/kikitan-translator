export default async function translateAZ(text: string, source: string, target: string) {
    const res = await fetch(`https://kikitan-translator.onrender.com/translate/azure?text=${text}&src=${source}&target=${target}`)

    if ((await res.text()) === "Failed to translate") {
        throw new Error("Failed to translate")
    }

    return (await res.json()).text
}