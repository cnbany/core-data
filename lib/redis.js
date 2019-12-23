const Redis = require("ioredis");
const Opt = require('config').get('server.redis_local');
let log = require("debug")("bany-redis:")


function redis(name) {
    name = name || "scenic"
    let res = {
        get: async (keys) => {
            log(`get: ${name} begin redis get.`)
            let ins = new Redis(Opt),
                res
            if (!keys || (Array.isArray(keys) && keys.length == 0))
                ret = await ins.hgetall(name)
            else if (Array.isArray(keys) && keys.length > 0)
                ret = await ins.hmget(name, ...keys)
            else if (typeof (keys) == 'string')
                ret = await ins.hget(name, keys)

            ins.disconnect()

            log(`get: ${name} finish redis get.`)
            return ret
        },


        set: async (kvs) => {
            log(`set: ${name} begin redis set.`)

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

            log(`set: ${name} finish redis set.`)

            return ret
        }
    }
    return res
}

module.exports = redis;

// (async () => {
//     let a = redis("test")
//     let kvs = [{
//             "k5": "v1"
//         },
//         {
//             "k6": "v2"
//         }
//     ]
//     let res = await a.set(kvs)
//     console.log(JSON.stringify(res))

//     kvs = {
//         "k7": "v1",
//         "k8": "v2"
//     }

//     res = await a.set(kvs)
//     console.log(JSON.stringify(res))

// })()

// log("or the debugger to disconnect...")