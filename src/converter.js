export const currencyConverter = (cc) => {
    let currentCurrencyCode;
    let observer;

    const CURRENCY_SYMBOL_CODE_MAP = {"ALL":"Lek","AFN":"؋","ARS":"$","AWG":"ƒ","AUD":"$","AZN":"₼","BSD":"$","BBD":"$","BYN":"Br","BZD":"BZ$","BMD":"$","BOB":"$b","BAM":"KM","BWP":"P","BGN":"лв","BRL":"R$","BND":"$","KHR":"៛","CAD":"$","KYD":"$","CLP":"$","CNY":"¥","COP":"$","CRC":"₡","HRK":"kn","CUP":"₱","CZK":"Kč","DKK":"kr","DOP":"RD$","XCD":"$","EGP":"£","SVC":"$","EUR":"€","FKP":"£","FJD":"$","GHS":"¢","GIP":"£","GTQ":"Q","GGP":"£","GYD":"$","HNL":"L","HKD":"$","HUF":"Ft","ISK":"kr","IDR":"Rp","IRR":"﷼","IMP":"£","ILS":"₪","JMD":"J$","JPY":"¥","JEP":"£","KZT":"лв","KPW":"₩","KRW":"₩","KGS":"лв","LAK":"₭","LBP":"£","LRD":"$","MKD":"ден","MYR":"RM","MUR":"₨","MXN":"$","MNT":"₮","MZN":"MT","NAD":"$","NPR":"₨","ANG":"ƒ","NZD":"$","NIO":"C$","NGN":"₦","NOK":"kr","OMR":"﷼","PKR":"₨","PAB":"B/.","PYG":"Gs","PEN":"S/.","PHP":"₱","PLN":"zł","QAR":"﷼","RON":"lei","RUB":"₽","SHP":"£","SAR":"﷼","RSD":"Дин.","SCR":"₨","SGD":"$","SBD":"$","SOS":"S","ZAR":"R","LKR":"₨","SEK":"kr","CHF":"CHF","SRD":"$","SYP":"£","TWD":"NT$","THB":"฿","TTD":"TT$","TVD":"$","UAH":"₴","GBP":"£","USD":"$","UYU":"$U","UZS":"лв","VEF":"Bs","VND":"₫","YER":"﷼","ZWD":"Z$"}; 

    const currencySymbolMatcher = new RegExp(`(${
        [Object.values(CURRENCY_SYMBOL_CODE_MAP), Object.keys(CURRENCY_SYMBOL_CODE_MAP)]
            .map(list => Array.from(list.reduce((s, v) => s.add(v), new Set())))
            .reduce((aggr, list) => aggr.concat(list), [])
            .join('|').replace(/\$|\.|\\/g, c => `\\${c}`)
    })`);

    const PRICE_MATCHER = `(?:((?:\\d+[.,\\s])*\\d+)\\s*${currencySymbolMatcher.source})`;
    const priceMatcherFull = new RegExp(`^\\s*${PRICE_MATCHER}\\s*$`);
    const priceMatcherAny = new RegExp(`(?<=^\\s*|\\s+)${PRICE_MATCHER}(?=\\s+|\\s*$)`);

    const install = () => {
        Intl.NumberFormat.prototype.parse = function(value) { 
            const [, thousands_separator, decimal_separator] = this.format(1234.567).match(/(?<=1)([^\d])(?:\d*4)(?:([^\d])(?=5\d*))?/i) || []; 
            const [,integer, decimal] = value.match(new RegExp(`([\\d\\s\\${thousands_separator}]+)(?:\\${decimal_separator}(\\d+))?`)) || []; 
            const cleanValue = `${(integer || "").replace(new RegExp(`\\s+|\\${thousands_separator}`, 'gm'), '') || '0'}.${decimal || '0'}`;
            return parseFloat(cleanValue); 
        };
    };

    const clear = () => {
        if (storageKey) {
            sessionStorage.removeItem(storageKey);
        }
        if(observer) {
            observer.disconnect();
        }
    };
    
    const uninstall = () => {
        delete Intl.NumberFormat.prototype.parse;
        clear();
    };

    const convert = async (currencyCode) => {
        storageKey = `currencyRate.${currencyCode.toLowerCase()}`; 
        const ratio = JSON.parse(sessionStorage.getItem(storageKey) || "null") 
            || await fetch(`https://www.floatrates.com/daily/${currencyCode.toLowerCase()}.json`).then(response => response.json()); 
        sessionStorage.setItem(storageKey, JSON.stringify(ratio)); 
        const currencyFormatter = new Intl.NumberFormat(navigator.language, { style: 'currency', currency: currencyCode.toUpperCase() }); 

        Array.from(document.getElementsByTagName("*"))
            .filter(e => priceMatcherFull.test(e.innerText) || (priceMatcherAny.test(e.innerText) && !e.childElementCount))
            .filter(e => e.getAttribute("currency-code") !== currencyCode)
            .forEach(e => {  
                //e.setAttribute('title', e.innerText);
                let srcCurrencyCode = e.getAttribute('src-currency-value');
                if (!srcCurrencyCode) {
                    const [, srcCurrencySymbol] = e.innerText.match(currencySymbolMatcher) || []; 
                    srcCurrencyCode = (Object.entries(CURRENCY_SYMBOL_CODE_MAP)
                        .find(([code, symbol]) => symbol === srcCurrencySymbol || code === srcCurrencySymbol) || [])[0];
                }
                
                let originalValue = e.getAttribute('currency-value');
                if (!originalValue) {
                    const currencyParser = new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: srcCurrencyCode.toUpperCase() }); 
                    originalValue = currencyParser.parse(e.innerText);
                }
                
                e.setAttribute('src-currency-code', srcCurrencyCode);
                e.setAttribute('src-currency-value', originalValue);
                const { inverseRate } = ratio[srcCurrencyCode.toLowerCase()] || {};
                const convertedValue = originalValue * inverseRate;
                e.setAttribute('currency-code', currencyCode); 
                e.innerText = e.innerText.replace(priceMatcherAny, currencyFormatter.format(convertedValue));  
            }); 
    };

    const activate = async (currencyCode) => {
        currentCurrencyCode = currencyCode;
        await convert(currencyCode);
        if(observer) {
            observer.disconnect();
        }
        observer = new MutationObserver(() => convert(currencyCode)); 
        observer.observe(document.getElementsByTagName("body")[0], {attributes: false, childList: true, subtree: true}); 
    };
    
    install();
    activate(cc);
}
