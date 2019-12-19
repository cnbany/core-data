const misc = {

    agent: (mode) => agent(mode),

    log: (...params) => log(...params),

    clear: (str) => clear(str)

}

module.exports = misc;

function agent(mode) {
    switch (mode) {
        case "pc":
            return pcAgents[Math.round(Math.random() * (pcAgents.length - 1))]

        case "mobile":
            return mobiAgents[Math.round(Math.random() * (mobiAgents.length - 1))]

        default:
            let Agents = [pcAgents, ...mobiAgents];
            return Agents[Math.round(Math.random() * (Agents.length - 1))]
    }
}

function log(...params) {

    let str = ""
    for (let i in params) {
        if (typeof (params[i]) !== 'string')
            str = str + JSON.stringify((params[i])) + " "
        else
            str = str + params[i] + " "
    }

    console.log(`${new Date().format()}: ${str}`)
}


Date.prototype.format = function (fmt) {

    date = this
    fmt = fmt || "yyyy-MM-dd hh:mm:ss S"

    const o = {
        'M+': date.getMonth() + 1, // 月份
        'd+': date.getDate(), // 日
        'h+': date.getHours(), // 小时
        'm+': date.getMinutes(), // 分
        's+': date.getSeconds(), // 秒
        'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
        'S': date.getMilliseconds() // 毫秒
    }
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
    for (var k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)))
    }
    return fmt
}

String.prototype.stripHTML = function () {
    var reTag = /<(?:.|\s)*?>/g;
    return this.replace(reTag, "");
}


function clear(str) {

    //替换数字
    const o = {
        '1': "一",
        '2': "二",
        '3': "三",
        '4': "四",
        '5': "五",
        '6': "六",
        '7': "七",
        '8': "八",
        '9': "九",
        '0': "零"
    }
    for (let k in o) {
        let re = new RegExp('(' + k + ')', 'g')
        if (re.test(str)) str = str.replace(re, o[k])
    }

    // 去掉转义字符
    str = str.replace(/[\s\'\"\\\/\b\f\n\r\-]/g, '');
    // 去掉特殊字符
    let re = new RegExp("[`~!@#$^&*%()=|{}':;'\",\\[\\].<>/?~！@#￥……&*（）&;|{}【】‘；：”“'。，、？]", 'g')
    str = str.replace(re, ' ');
    return str
}

const pcAgents = [
    //safari 5.1 – MAC
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50",
    //safari 5.1 – Windows
    "Mozilla/5.0 (Windows; U; Windows NT 6.1; en-us) AppleWebKit/534.50 (KHTML, like Gecko) Version/5.1 Safari/534.50",
    //IE 9.0
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0;",
    //IE 8.0
    "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)",
    //IE 7.0
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)",
    //IE 6.0
    "Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)",
    //Firefox 4.0.1 – MAC
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
    //Firefox 4.0.1 – Windows
    "Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
    //Opera 11.11 – MAC
    "Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; en) Presto/2.8.131 Version/11.11",
    //Opera 11.11 – Windows
    "Opera/9.80 (Windows NT 6.1; U; en) Presto/2.8.131 Version/11.11",
    //Chrome 17.0 – MAC
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_0) AppleWebKit/535.11 (KHTML, like Gecko) Chrome/17.0.963.56 Safari/535.11",
    //傲游(Maxthon)
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Maxthon 2.0)",
    //腾讯TT
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; TencentTraveler 4.0)",
    //世界之窗(The World) 2.x
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)",
    //世界之窗(The World) 3.x
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; The World)",
    //搜狗浏览器 1.x
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; SE 2.X MetaSr 1.0; SE 2.X MetaSr 1.0; .NET CLR 2.0.50727; SE 2.X MetaSr 1.0)",
    //360浏览器
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; 360SE)",
    //Avant
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Avant Browser)",
    //Green Browser
    "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1)"
]

const mobiAgents = [
    //safari iOS 4.33 – iPhone
    "Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5",
    //safari ios 4.33 – iPod Touch
    "Mozilla/5.0 (iPod; U; CPU iPhone OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5",
    //safari iOS 4.33 – iPad
    "Mozilla/5.0 (iPad; U; CPU OS 4_3_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8J2 Safari/6533.18.5",
    //Android N1
    "Mozilla/5.0 (Linux; U; android 2.3.7; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
    //Android QQ浏览器 For android
    "MQQBrowser/26 Mozilla/5.0 (linux; U; Android 2.3.7; zh-cn; MB200 Build/GRJ22; CyanogenMod-7) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
    //Android Opera Mobile
    "Opera/9.80 (Android 2.3.4; Linux; Opera Mobi/build-1107180945; U; en-GB) Presto/2.8.149 Version/11.10",
    //Android Pad Moto Xoom
    "Mozilla/5.0 (Linux; U; Android 3.0; en-us; Xoom Build/HRI39) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13",
    //BlackBerry
    "Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en) AppleWebKit/534.1+ (KHTML, like Gecko) Version/6.0.0.337 Mobile Safari/534.1+",
    //WebOS HP Touchpad
    "Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.0; U; en-US) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/233.70 Safari/534.6 TouchPad/1.0",
    //Nokia N97
    "Mozilla/5.0 (SymbianOS/9.4; Series60/5.0 NokiaN97-1/20.0.019; Profile/MIDP-2.1 Configuration/CLDC-1.1) AppleWebKit/525 (KHTML, like Gecko) BrowserNG/7.1.18124",
    //Windows Phone Mango
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0; HTC; Titan)",
    //UC无
    "UCWEB7.0.2.37/28/999",
    //UC标准
    "NOKIA5700/ UCWEB7.0.2.37/28/999",
    //UCOpenwave
    "Openwave/ UCWEB7.0.2.37/28/999",
    //UC Opera
    "Mozilla/4.0 (compatible; MSIE 6.0; ) Opera/UCWEB7.0.2.37/28/999"
]