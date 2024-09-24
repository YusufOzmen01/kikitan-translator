import requests, uuid, json
import requests, uuid, json, os

class Azure:
    region: str = None
    apikey: str = None
    
    def __init__(self, region: str, apikey: str):  
        self.region = region
        self.apikey = apikey
            
    def translate(self, text: str, src: str, target: str):
        params = {
            'api-version': '3.0',
            'from': src,
            'to': target
        }

        headers = {
            'Ocp-Apim-Subscription-Key': self.apikey,
            'Ocp-Apim-Subscription-Region': self.region,
            'Content-type': 'application/json',
            'X-ClientTraceId': str(uuid.uuid4())
        }

        body = [{
            'text': text
        }]

        request = requests.post("https://api.cognitive.microsofttranslator.com/translate", params=params, headers=headers, json=body)
        response = request.json()

        return response[0]["translations"][0]["text"]