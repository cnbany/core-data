const fs = require('graceful-fs');

const sc = fs.readFileSync(__dirname + "/../res/chinese_sc.txt", "utf8")
const tc = fs.readFileSync(__dirname + "/../res/chinese_tc.txt", "utf8")


const chinese = {};

//是否包含繁体
chinese.ist = function (str) {
    str = str || this;
    for (i = 0, len = str.length; i < len; i++) {
        if (tc.indexOf(str.charAt(i)) >= 0)
            return true
    }
    return false
}


//是否中文
chinese.isc = function (str, all = false) {
    str = str || this;
    let re = (all) ? /^[\u4E00-\u9FA5]+$/ : /[\u4E00-\u9FA5]+/
    return re.test(str)
}

//简体转繁体
chinese.s2t = function (str) {
    let ret = "",
        i, len, idx;
    str = str || this;
    for (i = 0, len = str.length; i < len; i++) {
        idx = sc.indexOf(str.charAt(i));
        ret += (idx === -1) ? str.charAt(i) : tc.charAt(idx);
    }
    return ret;
}

//繁体转简体
chinese.t2s = function (str) {
    var ret = "",
        i, len, idx;
    str = str || this;
    for (i = 0, len = str.length; i < len; i++) {
        idx = tc.indexOf(str.charAt(i));
        ret += (idx === -1) ? str.charAt(i) : sc.charAt(idx);
    }
    return ret;
}

chinese.attach = function () {
    ["s2t", "t2s"].forEach(function (name, i) {
        if (!String.prototype[name]) {
            String.prototype[name] = chinese[name];
        }
    });
}

module.exports = chinese;