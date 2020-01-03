process.env.DEBUG = "bany-scenic-*"

const _ = require("loadsh"),
    fs = require('../lib/fs'),
    log = require("debug")("bany-scenic-bany:"),
    ids = require("../lib/redis")("ids"),
    mdd = require("./bany/district"),
    poi = require("./bany/scenic")

async function processAmap() {
    let logtime = require("debug")("bany-scenic-time")
    logtime("processAmap start")
    let db = require("../lib/redis")("amap", "json"),
        chunks = _.chunk(await db.hkeys(), 10000)

    for (let i in chunks) {
        log(i * 10000, "start")
        let scenics = []
        let res = await db.hget(chunks[i])
        for (let i in res) {
            if (!res[i].district) {
                let id = await ids.hget(res[i].poi)
                let ss = await poi.get(id)
                if (!ss) {
                    res[i].id = id
                    let district = await mdd.match(res[i].address)
                    res[i].adcode = district.adcode
                    delete district.districts.country
                    res[i].districts = district.districts
                    res[i].external.amap.crw = new Date().valueOf()
                } else if (!ss.external.amap || !ss.external.amap.crw) {
                    res[i].id = id
                    let district = await mdd.match(res[i].address)
                    res[i].adcode = district.adcode
                    delete district.districts.country
                    res[i].districts = district.districts
                    res[i].external.amap.crw = new Date().valueOf()
                }else continue
                
                let o = {}
                o[id] = JSON.stringify(res[i])
                scenics.push(o)
            }
        }
        await poi.set(scenics)
    }
    logtime("processAmap end!")
    logtime("output bany.db start")
    await poi.dump()
    logtime("output bany.db end")

    db.done()
}

(async () => {
    await processAmap()
    // await poi.dump()
    ids.done()
    mdd.done()
    poi.done()
})()