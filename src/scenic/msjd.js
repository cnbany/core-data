//restapi.amap.com/v3/place/text?key=您的key&keywords=门头沟黄芩仙谷景区&types=&city=北京&children=1&offset=20&page=1&extensions=all

const _ = require("lodash");
const qs = require('qs');
const config = require('config');

const fs = require("../../libs/fs")
const misc = require("../../libs/misc");
const log = misc.log

const Got = require("got");
const EventEmitter = require('events').EventEmitter

const got = Got.extend({
    // baseUrl : "http://restapi.amap.com/v3/place/text",
    json: true,
    headers: {
        "Content-Type": "application/json"
    }
});



async function match(keyword, city) {
    if (!keyword) return null
    let params = {
        'key': "958e135e16b074d7eb29e261b85a075f",
        'city': city || "",
        'keywords': keyword,
        'extensions': 'all',
        'output': 'json',
        'type': '风景名胜',
        'offset': '50',
        'page': 1
    }

    let url = "http://restapi.amap.com/v3/place/text?" + qs.stringify(params)


    const {
        body
    } = await got.get(url);
    // log("end")
    return body
};

(async () => {
    log("start")
    for (let i = 0; i < 100; i++)
        await match("天津临港生态湿地公园")
    log("end")
})()