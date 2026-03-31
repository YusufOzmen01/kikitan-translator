import { Config, get_language, load_config } from "../util/config"
import { GROQ_MODEL, GROQ_PROMPT } from "../util/constants"
import { localization } from "../util/localization";

export default async function (text: string, source: string, target: string, showNotification: ((message: string, severity: "success" | "error" | "warning" | "info") => void) | null = null, setConfig: ((config: Config) => void) | null = null) {
    const url = `https://api.groq.com/openai/v1/chat/completions`
    const config = load_config();

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${config.groq.api_key}`
        },
        body: JSON.stringify({
         "messages": [
           {
             "role": "system",
             "content": GROQ_PROMPT
           },
           {
             "role": "user",
             "content": `${source} | ${target} | ${text}`
           }
         ],
         "model": GROQ_MODEL,
         "temperature": 1,
         "max_completion_tokens": 8192,
         "top_p": 1,
         "stop": null
       })
    })
    if (res.status == 401) {
      showNotification?.(`[GROQ] ${localization.invalid_api_key_groq[get_language()]}`, "error");

      return ""
    } else if (res.status == 429) {
      showNotification?.(`[GROQ] ${localization.limit_reached[get_language()]}`, "error");

      return ""
    }

    const data = await res.json()
    let base_used_tokens = config.groq.used_tokens;
    if (new Date(Date.now()).getUTCDay() != config.groq.last_used_day) {
      base_used_tokens = 0;
    }

    setConfig?.({
      ...config,
      groq: {
        ...config.groq,
        used_tokens: base_used_tokens + data.usage.total_tokens,
        last_used_day: new Date(Date.now()).getUTCDay()
      }
    })

    return data.choices[0].message.content.trim()
}