//restapi.amap.com/v3/place/text?key=您的key&keywords=门头沟黄芩仙谷景区&types=&city=北京&children=1&offset=20&page=1&extensions=all

process.env.DEBUG = "bany-scenic*"
const _ = require("lodash");
const qs = require('qs');

const config = require('config');

const fs = require("../lib/fs")

const log = require("debug")("bany-scenic:")
const redis = require('../lib/redis')("scenics", "json");
const ids = require('../lib/redis')("ids")

const Got = require("got");


const got = Got.extend({
    // baseUrl: "http://restapi.amap.com/v3/place/text",
    json: true,
    headers: {
        "Content-Type": "application/json"
    }
});

async function parse(body) {
    let res = []
    for (let poi of body.pois) {
        let amapid = poi.id,
            id = await ids.hget(amapid),
            scenic = await redis.hget(id)

        log(poi.id,poi.name)
        log(id)
        log(scenic)
        res.push(scenic)
    }
    return res
}

const scenic = {
    done: () => {
        ids.done()
        redis.done()
    },

    get: async function (keys) {
        return await redis.hget(keys)
    },

    match: async (name, city = "") => {

        log(`match: is begin. match  `, name, city)

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

        let result = await parse(res.body)
        log(`match: is done. find `, result.length)
        return result
    },
}

module.exports = scenic;

// (async () => {
//     log("start")
//     // for (let i = 0; i < 100; i++)
//     log(await match("南开大学","120104"))
//     log("end")
// })()