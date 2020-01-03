process.env.DEBUG = "bany-scenic*"

const _ = require("lodash"),
    fs = require("../../lib/fs"),
    log = require("debug")("bany-scenic:"),
    ids = require('../../lib/redis')("ids", 12),
    aoi = require('../../lib/redis')("scenic", "json"),
    amap = require('../../lib/amap'),
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
            txt = await aoi.hget(id)

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
        aoi.done()
    },

    hget: async function (keys) {
        return await aoi.hget(keys)
    },

    hset: async function (kvs) {
        return await aoi.hset(kvs)
    },

    hdump: async function (file) {
        return await aoi.hdump(file)
    },

    merge: async (src) => {
        let dst = (src.id) ? await aoi.hget(src.id) : await match(src.name, src.adcode)
        if (dst) dst = merge(dst, src)
        let o = {}
        o[dst.id] =  JSON.stringify(dst)
        await aoi.hset(o)
    }

}

module.exports = scenic;

// (async () => {
//     await match("包公园", '342401')
// })()