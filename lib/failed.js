const _ = require('lodash');
const shell = require('./adb');
var fcount = 0

function onFailed(err) {

    console.error(err);
    if (err && err.code) {
        if (_.startsWith(err.code, "4") || _.startsWith(err.code, "5"))
            if (fcount++ > 2)
            {
                console.log("need restart proxy server")
                shell.ipflush()
                fcount = 0
            }
    } else {
        fcount = 0
    }
}

module.exports = onFailed;