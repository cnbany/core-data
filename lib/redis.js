const misc = require('./misc');

const Redis = require("ioredis");
const Opt = require('config').get('server.redis');



module.exports = {

    get: async (name = "scenic") => {
        let log = require("debug")("redis:get")
        log("begin redis get.")
        let redis = new Redis(Opt);
        let ret = await redis.hgetall(name)
        redis.quit()
        log(`finish redis get.`)
        return ret
    },

    set: async (kvs, name) => {
        if (!name) return -1
        let log = require("debug")("redis:set")
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