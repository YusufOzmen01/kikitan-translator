from openai import OpenAI

class ChatGPT:
    client: OpenAI = None
    
    def __init__(self, api_key: str):
        self.client = OpenAI(api_key=api_key)

    def translate(self, text: str, src: str, target: str):
        response = self.client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "user", "content": f"You are a translator. Translate the following {src} text to {target}." + text}
            ]
        )
        
        return {
            "content": response.choices[0].message.content,
            "token_usage": response.usage.total_tokens
        }