import { GEMINI_TRANSLATION_PROMPT } from "../util/constants"

export default async function (text: string, source: string, target: string, apikey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apikey.trim()}`

  const res = await fetch(url,
    {
      method: "POST",
      body: JSON.stringify({
        system_instruction: {
          parts: { text: GEMINI_TRANSLATION_PROMPT(source, target) }
        },
        contents: [
          {
            parts: { text: text }
          }
        ]
      })
    }
  )

  if (res.status != 200) {
    switch (res.status) {
      case 403:
        throw new Error("AUTH_FAIL")
      case 429:
        throw new Error("RATE_LIMIT")
      default:
        throw new Error("UNKNOWN_ERROR")
    }
  }

  const data = await res.json()
  if (data.error != undefined) {
    throw new Error(data.error.message)
  }

  return data.candidates[0].content.parts[0].text
}  