const _ = require("lodash"),
    log = require("debug")("bany-ids:"),
    // ids = require('../../lib/redis')("ids", 12),
    ids = require('@cnbany/redis')("ids"),
    gen = require('nanoid/non-secure/generate')

let len = 12

ids._hget = ids.hget
//为新记录生成新ID
ids.hget = async function (keys) {

    let ret = await ids._hget(keys)

    if (_.isArray(ret) || _.isObject(ret)) {
        let o = {}
        for (let i in ret) {
            if (!ret[i]) {
                ret[i] = gen('1234567890abcdef', len)
                o[keys[i]] = ret[i]
            }
        }
        if (JSON.stringify(o) !== "{}")
            await ids.hset(name, o)
    } else if (_.isString(keys) && !ret) {
        ret = gen('1234567890abcdef', len)
        await ids.hset(name, keys, ret)
    }
    return ret
}


module.exports = ids;