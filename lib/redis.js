const Redis = require("ioredis");
const Opt = require('config').get('server.redis_local');
let log = require("debug")("bany-redis:")


function redis(name) {
    name = name || "scenic"
    let res = {
        get: async (keys) => {
            log(`get: is begin. get [${name}] `, keys)
            let ins = new Redis(Opt),
                res
            if (!keys || (Array.isArray(keys) && keys.length == 0))
                ret = await ins.hgetall(name)
            else if (Array.isArray(keys) && keys.length > 0)
                ret = await ins.hmget(name, ...keys)
            else if (typeof (keys) == 'string')
                ret = await ins.hget(name, keys)

            ins.disconnect()

            log(`get: is success done! get [${name}] `, ret)
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
