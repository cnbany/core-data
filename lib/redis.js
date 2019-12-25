process.env.DEBUG = "bany-*"

const _ = require("lodash")
const Redis = require("ioredis");
const Opt = require('config').get('server.redis_local');
const log = require("debug")("bany-redis:")
const gen = require('nanoid/non-secure/generate')


//返回json对象
function _json(ret) {

    if (_.isArray(ret) || _.isObject(ret))
        for (let i in ret)
            ret[i] = (ret[i]) ? JSON.parse(ret[i]) : {}

    else if (_.isString(ret))
        ret = (ret) ? JSON.parse(ret) : {}

    return ret
}

//为新记录生成新ID
async function _gen(name, ins, keys, ret, len) {

    if (_.isArray(ret) || _.isObject(ret)) {
        let o = {}
        for (let i in ret) {
            if (!ret[i]) {
                ret[i] = gen('1234567890abcdef', len)
                o[keys[i]] = ret[i]
            }
        }
        if (JSON.stringify(o) !== "{}")
            await ins.hmset(name, o)
    } else if (_.isString(keys) && !ret) {
        ret = gen('1234567890abcdef', len)
        await ins.hset(name, keys, ret)
    }

    return ret
}



function redis(name, opt) {
    name = name || "bany"
    let len = (_.isNumber(opt)) ? opt : null
    let json = (opt == "json") ? true : false


    let obj = {
        get: async (keys) => {
            log(`get: is begin. get [${name}] `, keys || "all")
            let ins = new Redis(Opt),
                ret
            // keys 为 null 时，获取所有信息
            if (!keys || (Array.isArray(keys) && keys.length == 0))
                ret = {}
            else if (keys == "all")
                ret = await ins.hgetall(name)
            else if (Array.isArray(keys) && keys.length > 0) {
                ret = await ins.hmget(name, ...keys)
            } else if (typeof (keys) == 'string') {
                ret = await ins.hget(name, keys)
                // 信息不存在是，自动生成指定长度的ID
            }

            if (len && ret != {}) ret = await _gen(name, ins, keys, ret, len)

            if (json && ret != {}) ret = _json(ret)


            ins.disconnect()

            log(`get: is success done! get [${name}] `)
            return ret
        },


        set: async (kvs) => {
            log(`set: is begin. set [${name}] `)

            let ins = new Redis(Opt);
            let pipeline = ins.pipeline();

            if (!kvs || (Array.isArray(kvs) && kvs.length == 0))
                return []

            else if (Array.isArray(kvs) && kvs.length > 0) {

                for (let i in kvs)
                    if (Object.keys(kvs[i]).length > 0)
                        for (let key in kvs[i])
                            pipeline.hset(name, key, kvs[i][key])

            } else if (Object.keys(kvs).length > 0) {

                for (let key in kvs)
                    pipeline.hset(name, key, kvs[key])
            }

            let ret = await pipeline.exec();
            ins.disconnect()

            //处理返回结果 [[nil,1],[nil,1]] => [1,1]
            for (let i in ret) {
                if (Array.isArray(ret[i]) && ret[i].length == 2)
                    ret[i] = ret[i][1]
            }

            log(`set: is success done! set [${name}] `)
            return ret
        }
    }
    return obj
}

module.exports = redis;

(async () => {
    // let a = redis("district","json")
    // log(await a.get("101e25e5"))
    // log(await a.get(["101e25e5", "0be70a83"]))
    // let b = redis("ids", 12)
    // log(await b.get("101e25e51"))
    // log(await b.get(["101e25e511", "0be70a8113"]))
})()