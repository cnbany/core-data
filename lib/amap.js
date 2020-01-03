const qs = require('qs'),
    Got = require("got");

const got = Got.extend({
    // baseUrl: "http://restapi.amap.com/v3/place/text",
    json: true,
    headers: {
        "Content-Type": "application/json"
    }
});


//restapi.amap.com/v3/place/text?key=您的key&keywords=门头沟黄芩仙谷景区&types=&city=北京&children=1&offset=20&page=1&extensions=all

async function _match(name, city) {
    if (!name) return []

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

    return res.body.pois || []
}

let amap = {
    search: async (name, city) => {
        return await _match(name, city)
    }
}

module.exports = amap;