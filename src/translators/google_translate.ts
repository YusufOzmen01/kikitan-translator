export default async function (text: string, source: string, target: string) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&dt=bd&dj=1&q=${text.replace("%/g", "%25")}`
    
    const res = await fetch(url)
    const data = await res.json()

    let final = ""

    final = unescape(data.sentences[0].trans)

    for (let i = 1; i < data.sentences.length; i++) {
        final += " " + unescape(data.sentences[i].trans)
    }

    return final
}