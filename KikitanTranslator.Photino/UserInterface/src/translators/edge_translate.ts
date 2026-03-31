export default async function (text: string, source: string, target: string, showNotification: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | null = null) {
    const url = `https://edge.microsoft.com/translate/translatetext?from=${source.split("-")[0]}&to=${target.split("-")[0]}&isEnterpriseClient=false`
    
    const res = await fetch(url, {
        method: "POST",
        body: JSON.stringify([text]),
        headers: {
            "Content-Type": "application/json"
        }
    })
    if (res.status != 200) {
        showNotification?.(`[EDGE TRANSLATE] Error translating text: ${res.status}`, "error");

        return 
    }

    const data = await res.json()

    return unescape(data[0].translations[0].text)
}