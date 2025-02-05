export const WHISPER_URL_GIST = "https://gist.githubusercontent.com/YusufOzmen01/130ffc8d3582575026c67db08d3163a4/raw"

export const langSource = [
    { name: { en: "English (United States)", jp: "英語 (アメリカ)", cn: "英语 (美国)", kr: "영어 (미국)", tr: "İngilizce (ABD)" }, code: "en-US" },
    { name: { en: "English (United Kingdom)", jp: "英語 (イギリス)", cn: "英语 (英国)", kr: "영어 (영국)", tr: "İngilizce (İngiltere)" }, code: "en-UK" },
    { name: { en: "English (Australia)", jp: "英語 (オーストラリア)", cn: "英语 (澳大利亚)", kr: "영어 (호주)", tr: "İngilizce (Avustralya)" }, code: "en-AU" },
    { name: { en: "English (India)", jp: "英語 (インド)", cn: "英语 (印度)", kr: "영어 (인도)", tr: "İngilizce (Hindistan)" }, code: "en-IN" },
    { name: { en: "English (New Zealand)", jp: "英語 (ニュージーランド)", cn: "英语 (新西兰)", kr: "영어 (뉴질랜드)", tr: "İngilizce (Yeni Zelanda)" }, code: "en-NZ" },
    { name: { en: "English (South Africa)", jp: "英語 (南アフリカ)", cn: "英语 (南非)", kr: "영어 (남아프리카)", tr: "İngilizce (Güney Afrika)" }, code: "en-ZA" },
    { name: { en: "Japanese", jp: "日本語", cn: "日语", kr: "일본어", tr: "Japonca" }, code: "ja" },
    { name: { en: "Arabic", jp: "アラビア語", cn: "阿拉伯语", kr: "아랍어", tr: "Arapça" }, code: "ar" },
    { name: { en: "Chinese", jp: "中国語", cn: "中文", kr: "중국어", tr: "Çince" }, code: "zh" },
    { name: { en: "Czech", jp: "チェコ語", cn: "捷克语", kr: "체코어", tr: "Çekçe" }, code: "cs" },
    { name: { en: "Dutch", jp: "オランダ語", cn: "荷兰语", kr: "네덜란드어", tr: "Hollandaca" }, code: "nl" },
    { name: { en: "Finnish", jp: "フィンランド語", cn: "芬兰语", kr: "핀란드어", tr: "Fince" }, code: "fi" },
    { name: { en: "French", jp: "フランス語", cn: "法语", kr: "프랑스어", tr: "Fransızca" }, code: "fr" },
    { name: { en: "German", jp: "ドイツ語", cn: "德语", kr: "독일어", tr: "Almanca" }, code: "de" },
    { name: { en: "Indonesian", jp: "インドネシア語", cn: "印尼语", kr: "인도네시아어", tr: "Endonezce" }, code: "id" },
    { name: { en: "Italian", jp: "イタリア語", cn: "意大利语", kr: "이탈리아어", tr: "İtalyanca" }, code: "it" },
    { name: { en: "Korean", jp: "韓国語", cn: "韩语", kr: "한국어", tr: "Korece" }, code: "ko" },
    { name: { en: "Polish", jp: "ポーランド語", cn: "波兰语", kr: "폴란드어", tr: "Lehçe" }, code: "pl" },
    { name: { en: "Portuguese", jp: "ポルトガル語", cn: "葡萄牙语", kr: "포르투갈어", tr: "Portekizce" }, code: "pt" },
    { name: { en: "Romanian", jp: "ルーマニア語", cn: "罗马尼亚语", kr: "루마니아어", tr: "Rumence" }, code: "ro" },
    { name: { en: "Russian", jp: "ロシア語", cn: "俄语", kr: "러시아어", tr: "Rusça" }, code: "ru" },
    { name: { en: "Spanish (Argentina)", jp: "スペイン語 (アルゼンチン)", cn: "西班牙语 (阿根廷)", kr: "스페인어 (아르헨티나)", tr: "İspanyolca (Arjantin)" }, code: "es-AR" },
    { name: { en: "Spanish (Chile)", jp: "スペイン語 (チリ)", cn: "西班牙语 (智利)", kr: "스페인어 (칠레)", tr: "İspanyolca (Şili)" }, code: "es-CL" },
    { name: { en: "Spanish (Mexico)", jp: "スペイン語 (メキシコ)", cn: "西班牙语 (墨西哥)", kr: "스페인어 (멕시코)", tr: "İspanyolca (Meksika)" }, code: "es-MX" },
    { name: { en: "Spanish (Peru)", jp: "スペイン語 (ペルー)", cn: "西班牙语 (秘鲁)", kr: "스페인어 (페루)", tr: "İspanyolca (Peru)" }, code: "es-PE" },
    { name: { en: "Spanish (Spain)", jp: "スペイン語 (スペイン)", cn: "西班牙语 (西班牙)", kr: "스페인어 (스페인)", tr: "İspanyolca (İspanya)" }, code: "es-ES" },
    { name: { en: "Spanish (US)", jp: "スペイン語 (アメリカ)", cn: "西班牙语 (美国)", kr: "스페인어 (미국)", tr: "İspanyolca (ABD)" }, code: "es-US" },
    { name: { en: "Swedish", jp: "スウェーデン語", cn: "瑞典语", kr: "스웨덴어", tr: "İsveççe" }, code: "sv" },
    { name: { en: "Turkish", jp: "トルコ語", cn: "土耳其语", kr: "터키어", tr: "Türkçe" }, code: "tr" }
] as const;

// The reason there are multiple englishes 
// is to have the same length as langSource
export const langTo = [
    { name: { en: "English", jp: "英語", cn: "英语", kr: "영어", tr: "İngilizce" }, code: "en" },
    { name: { en: "Japanese", jp: "日本語", cn: "日语", kr: "일본어", tr: "Japonca" }, code: "ja" },
    { name: { en: "Arabic", jp: "アラビア語", cn: "阿拉伯语", kr: "아랍어", tr: "Arapça" }, code: "ar" },
    { name: { en: "Armenian", jp: "アルメニア語", cn: "亚美尼亚语", kr: "아르메니아어", tr: "Ermenice" }, code: "hy" },
    { name: { en: "Bengali", jp: "ベンガル語", cn: "孟加拉语", kr: "벵골어", tr: "Bengalce" }, code: "bn" },
    { name: { en: "Bulgarian", jp: "ブルガリア語", cn: "保加利亚语", kr: "불가리아어", tr: "Bulgarca" }, code: "bg" },
    { name: { en: "Catalan", jp: "カタルーニャ語", cn: "加泰罗尼亚语", kr: "카탈루냐어", tr: "Katalanca" }, code: "ca" },
    { name: { en: "Chinese", jp: "中国語", cn: "中文", kr: "중국어", tr: "Çince" }, code: "zh" },
    { name: { en: "Croatian", jp: "クロアチア語", cn: "克罗地亚语", kr: "크로아티아어", tr: "Hırvatça" }, code: "hr" },
    { name: { en: "Czech", jp: "チェコ語", cn: "捷克语", kr: "체코어", tr: "Çekçe" }, code: "cs" },
    { name: { en: "Danish", jp: "デンマーク語", cn: "丹麦语", kr: "덴마크어", tr: "Danca" }, code: "da" },
    { name: { en: "Dutch", jp: "オランダ語", cn: "荷兰语", kr: "네덜란드어", tr: "Hollandaca" }, code: "nl" },
    { name: { en: "Estonian", jp: "エストニア語", cn: "爱沙尼亚语", kr: "에스토니아어", tr: "Estonca" }, code: "et" },
    { name: { en: "Finnish", jp: "フィンランド語", cn: "芬兰语", kr: "핀란드어", tr: "Fince" }, code: "fi" },
    { name: { en: "French", jp: "フランス語", cn: "法语", kr: "프랑스어", tr: "Fransızca" }, code: "fr" },
    { name: { en: "German", jp: "ドイツ語", cn: "德语", kr: "독일어", tr: "Almanca" }, code: "de" },
    { name: { en: "Greek", jp: "ギリシャ語", cn: "希腊语", kr: "그리스어", tr: "Yunanca" }, code: "el" },
    { name: { en: "Gujarati", jp: "グジャラート語", cn: "古吉拉特语", kr: "구자라트어", tr: "Gujaratece" }, code: "gu" },
    { name: { en: "Hindi", jp: "ヒンディー語", cn: "印地语", kr: "힌디어", tr: "Hintçe" }, code: "hi" },
    { name: { en: "Hungarian", jp: "ハンガリー語", cn: "匈牙利语", kr: "헝가리어", tr: "Macarca" }, code: "hu" },
    { name: { en: "Icelandic", jp: "アイスランド語", cn: "冰岛语", kr: "아이슬란드어", tr: "İzlandaca" }, code: "is" },
    { name: { en: "Indonesian", jp: "インドネシア語", cn: "印尼语", kr: "인도네시아어", tr: "Endonezyaca" }, code: "id" },
    { name: { en: "Italian", jp: "イタリア語", cn: "意大利语", kr: "이탈리아어", tr: "İtalyanca" }, code: "it" },
    { name: { en: "Kazakh", jp: "カザフ語", cn: "哈萨克语", kr: "카자흐어", tr: "Kazakça" }, code: "kk" },
    { name: { en: "Khmer", jp: "クメール語", cn: "高棉语", kr: "크메르어", tr: "Kmerce" }, code: "km" },
    { name: { en: "Korean", jp: "韓国語", cn: "韩语", kr: "한국어", tr: "Korece" }, code: "ko" },
    { name: { en: "Lao", jp: "ラオ語", cn: "老挝语", kr: "라오어", tr: "Laosça" }, code: "lo" },
    { name: { en: "Latvian", jp: "ラトビア語", cn: "拉脱维亚语", kr: "라트비아어", tr: "Letonca" }, code: "lv" },
    { name: { en: "Lithuanian", jp: "リトアニア語", cn: "立陶宛语", kr: "리투아니아어", tr: "Litvanca" }, code: "lt" },
    { name: { en: "Macedonian", jp: "マケドニア語", cn: "马其顿语", kr: "마케도니아어", tr: "Makedonca" }, code: "mk" },
    { name: { en: "Marathi", jp: "マラーティー語", cn: "马拉地语", kr: "마라티어", tr: "Marathi" }, code: "mr" },
    { name: { en: "Mongolian", jp: "モンゴル語", cn: "蒙古语", kr: "몽골어", tr: "Moğolca" }, code: "mn" },
    { name: { en: "Nepali", jp: "ネパール語", cn: "尼泊尔语", kr: "네팔어", tr: "Nepalce" }, code: "ne" },
    { name: { en: "Norwegian", jp: "ノルウェー語", cn: "挪威语", kr: "노르웨이어", tr: "Norveççe" }, code: "no" },
    { name: { en: "Odia", jp: "オディア語", cn: "奥里亚语", kr: "오디아어", tr: "Odiya" }, code: "or" },
    { name: { en: "Punjabi", jp: "パンジャブ語", cn: "旁遮普语", kr: "펀자비어", tr: "Pencapça" }, code: "pa" },
    { name: { en: "Persian", jp: "ペルシャ語", cn: "波斯语", kr: "페르시아어", tr: "Farsça" }, code: "fa" },
    { name: { en: "Polish", jp: "ポーランド語", cn: "波兰语", kr: "폴란드어", tr: "Lehçe" }, code: "pl" },
    { name: { en: "Portuguese", jp: "ポルトガル語", cn: "葡萄牙语", kr: "포르투갈어", tr: "Portekizce" }, code: "pt" },
    { name: { en: "Romanian", jp: "ルーマニア語", cn: "罗马尼亚语", kr: "루마니아어", tr: "Romence" }, code: "ro" },
    { name: { en: "Russian", jp: "ロシア語", cn: "俄语", kr: "러시아어", tr: "Rusça" }, code: "ru" },
    { name: { en: "Sinhala", jp: "シンハラ語", cn: "僧伽罗语", kr: "싱할라어", tr: "Singalaca" }, code: "si" },
    { name: { en: "Slovak", jp: "スロバキア語", cn: "斯洛伐克语", kr: "슬로바키아어", tr: "Slovakça" }, code: "sk" },
    { name: { en: "Slovenian", jp: "スロベニア語", cn: "斯洛文尼亚语", kr: "슬로베니아어", tr: "Slovence" }, code: "sl" },
    { name: { en: "Spanish", jp: "スペイン語", cn: "西班牙语", kr: "스페인어", tr: "İspanyolca" }, code: "es" },
    { name: { en: "Swedish", jp: "スウェーデン語", cn: "瑞典语", kr: "스웨덴어", tr: "İsveççe" }, code: "sv" },
    { name: { en: "Tamil", jp: "タミル語", cn: "泰米尔语", kr: "타밀어", tr: "Tamilce" }, code: "ta" },
    { name: { en: "Telugu", jp: "テルグ語", cn: "泰卢固语", kr: "텔루구어", tr: "Telugu" }, code: "te" },
    { name: { en: "Thai", jp: "タイ語", cn: "泰语", kr: "태국어", tr: "Tayca" }, code: "th" },
    { name: { en: "Turkish", jp: "トルコ語", cn: "土耳其语", kr: "터키어", tr: "Türkçe" }, code: "tr" },
    { name: { en: "Ukrainian", jp: "ウクライナ語", cn: "乌克兰语", kr: "우크라이나어", tr: "Ukraynaca" }, code: "uk" },
    { name: { en: "Urdu", jp: "ウルドゥー語", cn: "乌尔都语", kr: "우르두어", tr: "Urduca" }, code: "ur" },
    { name: { en: "Uzbek", jp: "ウズベク語", cn: "乌兹别克语", kr: "우즈베크어", tr: "Özbekçe" }, code: "uz" },
    { name: { en: "Vietnamese", jp: "ベトナム語", cn: "越南语", kr: "베트남어", tr: "Vietnamca" }, code: "vi" }
] as const;

export type Lang = "en" | "jp" | "cn" | "kr" | "tr";

export function calculateMinWaitTime(text: string, speed: number) {
    return (escape(text).length / 3) * speed // in ms
}

export function findLangSourceIndex(code: string) {
    return langSource.findIndex((lang) => lang.code === code)
}

export function findLangToIndex(code: string) {
    return langTo.findIndex((lang) => lang.code === code)
}

export async function getWhisperPackageURL(os: string) {
    const res = await (await fetch(WHISPER_URL_GIST)).json()
    
    return res[os]
}