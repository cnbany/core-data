process.env.DEBUG = "bany-scenic*"

const _ = require("lodash"),
    fs = require("@cnbany/fs"),
    ids = require('./ids'),
    log = require("debug")("bany-scenic:"),
    scenic = require('@cnbany/redis')("scenic", "json"),
    amap = require('../../lib/amap')



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

scenic.match = async function (name, city) {

    let pois = await amap.search(name, city),
        result = []

    for (let poi of pois) {
        let amapid = poi.id,
            id = await ids.hget(amapid),
            txt = await this.hget(id)

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


scenic.merge = async  function (src)  {
    let dst = (src.id) ? await this.hget(src.id) : await this.match(src.name, src.adcode)
    if (dst) dst = merge(dst, src)
    let o = {}
    o[dst.id] = JSON.stringify(dst)
    await this.hset(o)
}

scenic._done = scenic.done

scenic.done = function (){
    this._done()
    ids.done()
}


module.exports = scenic;

(async () => {
    await scenic.match("包公园", '342401')
    scenic.done()
})()