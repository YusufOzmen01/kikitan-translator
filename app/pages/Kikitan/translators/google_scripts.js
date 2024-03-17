export default async function (text, source, target) {
    const res = await fetch(`https://script.google.com/macros/s/AKfycbyJAqvnM48iCprE_YyNnb03F0yG3fipQCgy_AEWjZI_bk6uSy6zyrfa9CQasHEw_dwJew/exec?text=${text}&source=${source}&target=${target}`)
    
    return unescape(await res.text()).trim()
}