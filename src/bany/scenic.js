//restapi.amap.com/v3/place/text?key=您的key&keywords=门头沟黄芩仙谷景区&types=&city=北京&children=1&offset=20&page=1&extensions=all

process.env.DEBUG = "bany-scenic*"
const _ = require("lodash");
const qs = require('qs');

const config = require('config');

const fs = require("../../lib/fs")

const log = require("debug")("bany-scenic:")

const redis = require('../../lib/redis')("scenics", "json");
const ids = require('../../lib/redis')("ids", 12)

const Got = require("got");


const got = Got.extend({
    // baseUrl: "http://restapi.amap.com/v3/place/text",
    json: true,
    headers: {
        "Content-Type": "application/json"
    }
});


function merge(dst, src) {
    //
    let res = {}
    _.merge(res, src, dst)

    //合并列表

    if (src.scenic &&  Array.isArray(res.scenic.qualify)) {
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

    if (!name) {
        log(`match: is none. name is null`)
        return []
    }

    let params = {
        'key': "958e135e16b074d7eb29e261b85a075f",
        'city': city,
        'citylimit': true,
        'keywords': name,
        'extensions': 'base',
        'output': 'json',
        'type': '风景名胜|高等院校',
        'offset': '1',
        'page': 0
    }

    let url = "http://restapi.amap.com/v3/place/text?" + qs.stringify(params)

    const res = await got.get(url);

    let result = []

    if (!res.body.pois ){
        log("error:",url)
        res.body.pois = []
    }

    for (let poi of res.body.pois) {
        let amapid = poi.id,
            id = await ids.hget(amapid),
            txt = await redis.hget(id)

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

        if (dst)
            dst = merge(dst, src)

        await redis.hset(dst.id, JSON.stringify(dst))
    },


}

module.exports = scenic;

