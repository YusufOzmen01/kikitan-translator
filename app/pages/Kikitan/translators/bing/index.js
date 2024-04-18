
const axios = require('axios')

const lang = require('./lang')
const config = require('./config.json')

const TRANSLATE_API_ROOT = 'https://{s}bing.com'
const TRANSLATE_WEBSITE = TRANSLATE_API_ROOT + config.websiteEndpoint
const TRANSLATE_API = TRANSLATE_API_ROOT + config.translateEndpoint
const TRANSLATE_API_SPELL_CHECK = TRANSLATE_API_ROOT + config.spellCheckEndpoint

// PENDING: make it configurable?
const MAX_RETRY_COUNT = 3

/**
* @type {GlobalConfig | undefined}
*/
let globalConfig
/**
* @type {Promise<GlobalConfig> | undefined}
*/
let globalConfigPromise

function replaceSubdomain(url, subdomain) {
 return url.replace('{s}', subdomain ? subdomain + '.' : '')
}

/**
* refetch global config if token is expired
* @return {boolean} whether token is expired or not
*/
function isTokenExpired() {
 if (!globalConfig) {
   return true
 }
 const { tokenTs, tokenExpiryInterval } = globalConfig
 return Date.now() - tokenTs > tokenExpiryInterval
}

/**
* fetch global config
*
* @param {string?} [userAgent]
* @param {GotAgents?} [proxyAgents]
*
* @returns {Promise<GlobalConfig>}
*/
async function fetchGlobalConfig(userAgent) {
 // use last subdomain if exists
 let subdomain = globalConfig && globalConfig.subdomain

 try {
   const { body, request: { redirects: [redirectUrl] } } = await axios.get(
     replaceSubdomain(TRANSLATE_WEBSITE, subdomain),
     {
       headers: {
         'user-agent': userAgent || config.userAgent
       },
       retry: {
         limit: MAX_RETRY_COUNT,
         methods: ['GET']
       }
     }
   )

   // when fetching for the second time, the subdomain may be unchanged
   if (redirectUrl) {
     subdomain = redirectUrl.match(/^https?:\/\/(\w+)\.bing\.com/)[1]
   }

   const IG = body.match(/IG:"([^"]+)"/)[1]
   const IID = body.match(/data-iid="([^"]+)"/)[1]

   const [key, token, tokenExpiryInterval] = JSON.parse(
     body.match(/params_AbusePreventionHelper\s?=\s?([^\]]+\])/)[1]
   )

   const requiredFields = {
     IG,
     IID,
     key,
     token,
     tokenTs: key,
     tokenExpiryInterval
   }
   // check required fields
   Object.entries(requiredFields).forEach(([field, value]) => {
     if (!value) {
       throw new Error(`failed to fetch required field: \`${field}\``)
     }
   })

   return globalConfig = {
     ...requiredFields,
     subdomain,
     // PENDING: reset count when value is large?
     count: 0
   }
 } catch (e) {
   console.error('failed to fetch global config')
   throw e
 }
}

/**
* @param {boolean} isSpellCheck
* @param {boolean} useEPT
*/
function makeRequestURL(isSpellCheck, useEPT) {
 const { IG, IID, subdomain } = globalConfig
 return replaceSubdomain(isSpellCheck ? TRANSLATE_API_SPELL_CHECK : TRANSLATE_API, subdomain)
   + '&IG=' + IG
   + '&IID=' + (IID + (isSpellCheck || useEPT ? '.' + (++globalConfig.count) : ''))
   + (
     isSpellCheck || !useEPT
       ? ''
       // PENDING: might no rate limit but some languages are not supported for now
       // (See also the `eptLangs` field in src/config.json)
       : '&ref=TThis' +
         '&edgepdftranslator=1'
   )
}

/**
* @param {boolean} isSpellCheck
* @param {string} text
* @param {string} fromLang
* @param {string} toLang
* @returns {{
*   fromLang: string,
*   to?: string,
*   text: string,
*   token: string,
*   key: number,
*   tryFetchingGenderDebiasedTranslations?: true
* }}
*/
function makeRequestBody(isSpellCheck, text, fromLang, toLang) {
 const { token, key } = globalConfig
 const body = {
   fromLang,
   text,
   token,
   key
 }
 if (!isSpellCheck) {
   toLang && (body.to = toLang)

   body.tryFetchingGenderDebiasedTranslations = true
 }
 return body
}

/**
* @param {GotCancelableRequest} request
*/
async function wrapRequest(request) {
 /**
  * @type {GotResponse}
  */
 let response
 /**
  * @type {GotRequestError}
  */
 let err

 try {
   response = await request
 } catch (e) {
   response = (err = e).response
 }

 /**
  * @type {string}
  */
 let readableErrMsg

 const body = response.body

 if (body.ShowCaptcha) {
   readableErrMsg = `Sorry that bing translator seems to be asking for the captcha, please take care not to request too frequently.`
 }
 else if (body.StatusCode === 401 || response.statusCode === 401) {
   readableErrMsg = `Translation limit exceeded. Please try it again later.`
 }
 else if (body.statusCode) {
   readableErrMsg = `Something went wrong!`
 }

 if (readableErrMsg) {
   const responseMsg = `Response status: ${response.statusCode} (${response.statusMessage})\nResponse body  : ${JSON.stringify(body)}`
   throw new Error(readableErrMsg + '\n' + responseMsg)
 }

 if (err) {
   const wrappedErr = new Error(`Failed to request translation service`)
   wrappedErr.stack += '\n' + err.stack
   throw wrappedErr
 }

 return body
}

/**
* To translate
*
* @param {string} text content to be translated
* @param {string} from source language code. `auto-detect` by default.
* @param {string} to target language code. `en` by default.
* @param {boolean} [correct] <optional> whether to correct the input text. `false` by default.
* @param {boolean} [raw] <optional> the result contains raw response if `true`
* @param {string} [userAgent] <optional> the expected user agent header
* @param {GotAgents} [proxyAgents] <optional> set agents of `got` for proxy
*
* @returns {Promise<TranslationResult | undefined>}
*/
async function translate(text, from, to, correct, raw, userAgent, proxyAgents) {
 if (!text || !(text = text.trim())) {
   return
 }

 if (!globalConfigPromise) {
   globalConfigPromise = fetchGlobalConfig(userAgent, proxyAgents)
 }

 await globalConfigPromise

 if (isTokenExpired()) {
   globalConfigPromise = fetchGlobalConfig(userAgent, proxyAgents)

   await globalConfigPromise
 }

 from = from || 'auto-detect'
 to = to || 'en'

 const fromSupported = lang.isSupported(from)
 const toSupported = lang.isSupported(to)

 if (!fromSupported || !toSupported) {
   throw new Error(`The language '${!fromSupported ? from : !toSupported ? to : ''}' is not supported!`)
 }

 from = lang.getLangCode(from)
 to = lang.getLangCode(to)

 to === 'auto-detect' && (to = 'en')

 const canUseEPT = text.length <= config.maxEPTTextLen
   && ([from, to].every(lang => lang === 'auto-detect' || config.eptLangs.includes(lang)))

 if (!canUseEPT) {
   // Currently 5000 is supported only in China
   // PENDING: dynamically re-generate local config.json when initializing?
   const maxTextLen = globalConfig.subdomain === 'cn'
     ? config.maxTextLenCN
     : config.maxTextLen

   if (text.length > maxTextLen) {
     throw new Error(`The supported maximum text length is ${maxTextLen}. Please shorten the text.`)
   }
 }

 const requestURL = makeRequestURL(false, canUseEPT)
 const requestBody = makeRequestBody(false, text, from, to)

 const requestHeaders = {
   'user-agent': userAgent || config.userAgent,
   referer: replaceSubdomain(TRANSLATE_WEBSITE, globalConfig.subdomain)
 }

 /**
  * @type {GotOptions['retry']}
  */
 const retryConfig = {
   limit: MAX_RETRY_COUNT,
   methods: ['POST']
 }

 const body = await wrapRequest(
   axios.post(requestURL, {
     headers: requestHeaders,
     // got will set CONTENT_TYPE as `application/x-www-form-urlencoded`
     form: requestBody,
     responseType: 'json',
     agent: proxyAgents,
     retry: canUseEPT ? 0 : retryConfig
   })
 )

 const translation = body[0].translations[0]
 const detectedLang = body[0].detectedLanguage

 /**
  * @type {TranslationResult}
  */
 const res = {
   text,
   userLang: from,
   translation: translation.text,
   language: {
     from: detectedLang.language,
     to: translation.to,
     score: detectedLang.score
   }
 }

 if (correct) {
   const correctLang = detectedLang.language
   const matcher = text.match(/"/g)
   const len = text.length + (matcher && matcher.length || 0)
   // currently, there is a limit of 50 characters for correction service
   // and only parts of languages are supported
   // otherwise, it will return status code 400
   if (len <= config.maxCorrectableTextLen && lang.isCorrectable(correctLang)) {
     const requestURL = makeRequestURL(true)
     const requestBody = makeRequestBody(true, text, correctLang)

     const body = await wrapRequest(
       axios.post(requestURL, {
         headers: requestHeaders,
         form: requestBody,
         responseType: 'json',
         agent: proxyAgents,
         retry: retryConfig
       })
     )

     res.correctedText = body && body.correctedText
   }
   else {
     console.warn(`The detected language '${correctLang}' is not supported to be corrected or the length of text is more than ${config.maxCorrectableTextLen}.`)
   }
 }

 if (raw) {
   res.raw = body
 }

 return res
}

module.exports = {
 translate,
 lang,
}
