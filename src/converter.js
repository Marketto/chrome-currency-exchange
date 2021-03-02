currencyExchange = async (currencyCode) => {  
     
    const CURRENCY_SYMBOL_CODE_MAP = {"ALL":"Lek","AFN":"؋","ARS":"$","AWG":"ƒ","AUD":"$","AZN":"₼","BSD":"$","BBD":"$","BYN":"Br","BZD":"BZ$","BMD":"$","BOB":"$b","BAM":"KM","BWP":"P","BGN":"лв","BRL":"R$","BND":"$","KHR":"៛","CAD":"$","KYD":"$","CLP":"$","CNY":"¥","COP":"$","CRC":"₡","HRK":"kn","CUP":"₱","CZK":"Kč","DKK":"kr","DOP":"RD$","XCD":"$","EGP":"£","SVC":"$","EUR":"€","FKP":"£","FJD":"$","GHS":"¢","GIP":"£","GTQ":"Q","GGP":"£","GYD":"$","HNL":"L","HKD":"$","HUF":"Ft","ISK":"kr","IDR":"Rp","IRR":"﷼","IMP":"£","ILS":"₪","JMD":"J$","JPY":"¥","JEP":"£","KZT":"лв","KPW":"₩","KRW":"₩","KGS":"лв","LAK":"₭","LBP":"£","LRD":"$","MKD":"ден","MYR":"RM","MUR":"₨","MXN":"$","MNT":"₮","MZN":"MT","NAD":"$","NPR":"₨","ANG":"ƒ","NZD":"$","NIO":"C$","NGN":"₦","NOK":"kr","OMR":"﷼","PKR":"₨","PAB":"B/.","PYG":"Gs","PEN":"S/.","PHP":"₱","PLN":"zł","QAR":"﷼","RON":"lei","RUB":"₽","SHP":"£","SAR":"﷼","RSD":"Дин.","SCR":"₨","SGD":"$","SBD":"$","SOS":"S","ZAR":"R","LKR":"₨","SEK":"kr","CHF":"CHF","SRD":"$","SYP":"£","TWD":"NT$","THB":"฿","TTD":"TT$","TVD":"$","UAH":"₴","GBP":"£","USD":"$","UYU":"$U","UZS":"лв","VEF":"Bs","VND":"₫","YER":"﷼","ZWD":"Z$"}; 
    const currencySymbolMatcher = new RegExp(`([a-zA-Z]{3}|${ 
        Array.from(Object.values(CURRENCY_SYMBOL_CODE_MAP) 
            .reduce((s, v) => s.add(v), new Set())) 
            .join('|') 
            .replace(/\$|\.|\\/g, c => `\\${c}`) 
    })`); 
    const priceMatcher = new RegExp(`^\\s*(?:((?:\\d+[.,\\s])*\\d+)\\s*${currencySymbolMatcher.source})\\s*$`);  
     
     
    Intl.NumberFormat.prototype.parse = function(value) { 
        const [, thousands_separator, decimal_separator] = this.format(1234.567).match(/(?<=1)([^\d])(?:\d*4)(?:([^\d])(?=5\d*))?/i) || []; 
        const [,integer, decimal] = value.replace(thousands_separator, "").match(new RegExp(`([\\d\\s${thousands_separator}]+)(?:${decimal_separator}(\\d+))?`)) || []; 
        return parseFloat(`${(integer || "").replace(new RegExp(`\\s+|${thousands_separator}`, 'gm'), '') || 0}.${decimal || 0}`); 
    }; 
    const storageKey = `currencyRate.${currencyCode.toLowerCase()}`; 
    const ratio = JSON.parse(sessionStorage.getItem(storageKey) || "null") 
        || await fetch(`https://www.floatrates.com/daily/${currencyCode.toLowerCase()}.json`).then(response => response.json()); 
    sessionStorage.setItem(storageKey, JSON.stringify(ratio)); 
     
    const currencyFormatter = new Intl.NumberFormat(navigator.language, { style: 'currency', currency: currencyCode.toUpperCase() }); 
    const converter = () => { 
        Array.from(document.getElementsByTagName("*")) 
            .filter(e => priceMatcher.test(e.innerText)) 
            .filter(e => e.getAttribute("currency") !== currencyCode) 
            .forEach(e => {  
                e.setAttribute('title', e.innerText); 
                e.setAttribute('currency', currencyCode);  
                const [, srcCurrencySymbol] = e.innerText.match(currencySymbolMatcher) || []; 
                const [srcCurrencyCode] = Object.entries(CURRENCY_SYMBOL_CODE_MAP).find(([code, symbol]) => symbol === srcCurrencySymbol || code === srcCurrencySymbol) || []; 
                const currencyParser = new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: srcCurrencyCode.toUpperCase() }); 
                e.innerText = currencyFormatter.format(currencyParser.parse(e.innerText) * (ratio[srcCurrencyCode.toLowerCase()] || {}).inverseRate);  
            }); 
    }; 
    converter(); 
    const observer = new MutationObserver(converter); 
    observer.observe(document.getElementsByTagName("body")[0], {attributes: false, childList: true, subtree: true}); 
};
