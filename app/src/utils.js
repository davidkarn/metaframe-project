export function normalize_site(url) {
    return url
        .replace(/https?:\/\//i, '')
        .replace(/\/.*/, '')
        .replace(/^www./, '') }
    

export function normalize_site_path(url) {
    return url
        .replace(/https?:\/\//i, '')
        .replace(/.*?\//, '')
        .replace(/\?.*/, '') }
    

export function query_parameters() {
    let params  = {}
    let s       = window.location.href.split("?")
    if (!s[1])
        return {}

    let lines = s[1].split("&")
    lines.map((line) => {
        let param = line.split("=")
        if (param[0] && param[1])
            params[param[0]] = decodeURIComponent(param[1] || "") })

    return params }
