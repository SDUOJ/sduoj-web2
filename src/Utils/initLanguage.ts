export function initLanguage() {
    let lang = localStorage.getItem('language') || navigator.language // 获取浏览器的语言环境，兼容IE的写法
    if (lang) {
        lang = lang.substr(0, 2).toLowerCase() // 截取前两位字符，并转化为小写
        return lang
    } else {
        return 'en'
    }
}
