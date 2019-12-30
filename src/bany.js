process.env.DEBUG = "bany*"

const _ = require("loadsh"),
    fs = require('../lib/fs'),
    log = require("debug")("bany-scenic-bany:"),
    mdd = require("./bany/district"),
    poi = require("./bany/scenic")

async function processAmap() {
    let db = require("../lib/redis")("amap", "json"),
        chunks = _.chunk(await db.hkeys(), 1000)

    for (let i in chunks) {
        let res = await db.hget(chunks[i])
        for ( let i in res){
            if (! res[i].district){
                let district = await mdd.match(res[i].address)
                res[i].adcode = district.adcode
                delete district.districts.country
                res[i].districts = district.districts
                log(1)
            }

        }


    }
    log(1)
}

(async () => {
    await processAmap()
    db.done()
    mdd.done()
    poi.done()
})()