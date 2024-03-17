export default async function (text, source, target) {
    const res = await (await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${source}&tl=${target}&dt=t&dt=bd&dj=1&q=${text.replaceAll("%", "%25")}`)).json()

    let final = ""

    final = unescape(res.sentences[0].trans)

    for (let i = 1; i < res.sentences.length; i++) {
        final += " " + unescape(res.sentences[i].trans)
    }

    return final
}  