const debug = require("debug")
const agents = require("./misc/agents")
const misc = {

    agent: (mode) => agent(mode),

    log: (...params) => log(...params),

    clear: (str) => clear(str)

}

module.exports = misc;

function agent(mode) {
    switch (mode) {
        case "pc":
            return pcAgents[Math.round(Math.random() * (agents.pc.length - 1))]

        case "mobile":
            return mobiAgents[Math.round(Math.random() * (agents.mobile.length - 1))]

        default:
            let agentsAll = [agents.pc, ...agents.mobile];
            return Agents[Math.round(Math.random() * (agentsAll.length - 1))]
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
