process.env.DEBUG = "bany-*"
const Redis = require("ioredis");
const Opt = require('config').get('server.redis_local');
const log = require("debug")("bany-redis:")
const gen = require('nanoid/non-secure/generate')

function redis(name, len) {
    name = name || "scenic"
    let res = {
        get: async (keys) => {
            log(`get: is begin. get [${name}] `, keys || "all")
            let ins = new Redis(Opt),
                res
            if (!keys || (Array.isArray(keys) && keys.length == 0)) {
                ret = await ins.hgetall(name)

            } else if (Array.isArray(keys) && keys.length > 0) {
                ret = await ins.hmget(name, ...keys)
                if (len) {
                    let o = {}
                    for (let i in ret) {
                        if (!ret[i]) {
                            ret[i] = gen('1234567890abcdef', len)
                            o[keys[i]] = ret[i]
                        }
                    }
                    if (JSON.stringify(o) !== "{}")
                        await ins.hmset(name, o)
                }
            } else if (typeof (keys) == 'string') {
                ret = await ins.hget(name, keys)
                if (!ret && len) {
                    ret = gen('1234567890abcdef', len)
                    await ins.hset(name, keys, ret)
                }
            }

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
            for (let i in ret) {
                if (Array.isArray(ret[i]) && ret[i].length == 2)
                    ret[i] = ret[i][1]
            }

            log(`set: is success done! set [${name}] `)
            return ret
        }
    }
    return res
}

module.exports = redis;