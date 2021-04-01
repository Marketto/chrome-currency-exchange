'use strict';
const Vue = require('vue');
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'

import './menu.scss';
// Make BootstrapVue available throughout your project
Vue.use(BootstrapVue);
// Optionally install the BootstrapVue icon components plugin
Vue.use(IconsPlugin);

const chromePromisify = (executor) => (...args) => new Promise((resolve) => executor(...args, ([result]) => resolve(result)));
const asyncTabExecuteScript = chromePromisify(chrome.tabs.executeScript);

new Vue({
    el: "#mainmenu",
    data: {
        title: chrome.i18n.getMessage("l10nName"),
    //    recording: xhrHistoryInjected,
        currencyCode: '',
        currencies: ["AFN","ALL","ANG","ARS","AUD","AWG","AZN","BAM","BBD","BGN","BMD","BND","BOB","BRL","BSD","BWP","BYN","BZD","CAD","CHF","CLP","CNY","COP","CRC","CUP","CZK","DKK","DOP","EGP","EUR","FJD","FKP","GBP","GGP","GHS","GIP","GTQ","GYD","HKD","HNL","HRK","HUF","IDR","ILS","IMP","IRR","ISK","JEP","JMD","JPY","KGS","KHR","KPW","KRW","KYD","KZT","LAK","LBP","LKR","LRD","MKD","MNT","MUR","MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR","PAB","PEN","PHP","PKR","PLN","PYG","QAR","RON","RSD","RUB","SAR","SBD","SCR","SEK","SGD","SHP","SOS","SRD","SVC","SYP","THB","TTD","TVD","TWD","UAH","USD","UYU","UZS","VEF","VND","XCD","YER","ZAR","ZWD"]
            .map(value => ({ value, text: value })),
    //    stopButtonLabel:chrome.i18n.getMessage("l10nStopButtonLabel"),
    //    recordButtonLabel: chrome.i18n.getMessage("l10nRecordButtonLabel")
    },
    watch: {
        currencyCode: async (newCurrencyCode) => {
            const { currencyConverter } = await import('../converter.js');
            await asyncTabExecuteScript(undefined, { code: `(${currencyConverter.toString()})('${newCurrencyCode}');` });
        }
    },
    methods: {
    }
});
