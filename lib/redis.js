
const misc = require('../libs/misc');

const Redis = require("ioredis");
const Opt = require('config').get('server.redis');

let log = misc.log

module.exports = {

    get: async (name = "scenic") => {
        log("begin redis get.")
        let redis = new Redis(Opt);
        let ret = await redis.hgetall(name)
        redis.quit()
        log(`finish redis get.`)
        return ret
    },

    set: async (kvs, name = "scenic") => {
        log("begin redis set.")
        let redis = new Redis(Opt);
        let pipeline = redis.pipeline();

        for (let key in kvs)
            pipeline.hset(name, key, kvs[key])

        let ret = await pipeline.exec();
        redis.quit()
        log("finish redis set.")
        return ret
    }
}


// log("or the debugger to disconnect...")