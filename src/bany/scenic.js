//restapi.amap.com/v3/place/text?key=您的key&keywords=门头沟黄芩仙谷景区&types=&city=北京&children=1&offset=20&page=1&extensions=all

process.env.DEBUG = "bany-scenic*"

const _ = require("lodash"),
    fs = require("../../lib/fs"),
    log = require("debug")("bany-scenic:"),
    ids = require('../../lib/redis')("ids", 12),
    amap = require('../../lib/amap'),
    bany = require('../../lib/redis')("scenics", "json"),
    config = require('config')



function merge(dst, src) {
    //
    let res = {}
    _.merge(res, src, dst)

    //合并列表

    if (src.scenic && Array.isArray(res.scenic.qualify)) {
        res.scenic.qualify.push(src.scenic.qualify)
        res.scenic.qualify = _.compact(res.scenic.qualify)
    }

    if (src.scenic && Array.isArray(res.scenic.special)) {
        res.scenic.special.push(src.scenic.special)
        res.scenic.special = _.compact(res.scenic.special)
    }

    res.alias.push(src.alias)
    res.alias = _.compact(res.alias)

    return res
}

async function match(name, city) {

    let pois = await amap.search(name, city),
        result = []

    for (let poi of pois) {
        let amapid = poi.id,
            id = await ids.hget(amapid),
            txt = await bany.hget(id)

        if (!txt)
            txt = {
                id: await ids.hget(poi.id),
                name: poi.name,
                external: {
                    amap: {
                        src: 'https://www.amap.com/detail/' + poi.id,
                        id: poi.id,
                        name: poi.name
                    }
                }
            }

        result.push(txt)
    }

    if (result.length > 0)
        log(`scenic match:`, name, city, "=>", result[0].name)
    else
        log(`scenic match is done. find `, name, city, "=>", null)
    return (result.length > 0) ? result[0] : {}
}

const scenic = {
    done: () => {
        ids.done()
        redis.done()
    },

    get: async function (keys) {
        return await redis.hget(keys)
    },

    merge: async (src) => {

        let dst = (src.id) ? await redis.hget(src.id) : await match(src.name, src.district)

        if (dst) dst = merge(dst, src)

        await redis.hset(dst.id, JSON.stringify(dst))
    },


}

module.exports = scenic;

(async () => {
    await match("包公园", '342401')
})()