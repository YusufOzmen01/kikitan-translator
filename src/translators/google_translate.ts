export default async function (text: string, source: string, target: string, showNotification: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | null = null) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&dt=bd&dj=1&q=${encodeURI(text)}`
    
    const res = await fetch(url)
    if (res.status != 200) {
        showNotification?.(`[GOOGLE TRANSLATE] Error translating text: ${res.status}`, "error");

        return 
    }

    const data = await res.json()

    let final = ""

    final = unescape(data.sentences[0].trans)

    for (let i = 1; i < data.sentences.length; i++) {
        final += " " + unescape(data.sentences[i].trans)
    }

    return final
}