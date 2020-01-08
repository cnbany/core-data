process.env.DEBUG = "bany-scenic*"

const _ = require("loadsh"),
    fs = require('@cnbany/fs'),
    log = require("debug")("bany-scenic-meet:"),
    mdd = require("./bany/district"),
    aoi = require("./bany/scenic"),
    dsl = require("bodybuilder"), //doc: https://bodybuilder.js.org/
    meet = require("@cnbany/redis")("meet", "json"),
    elastic = require("@cnbany/elastic"),
    timestamp = require("debug")("bany-scenic-timestamp")




function _done() {
    meet.done()
    mdd.done()
    aoi.done()
}

function parseDetail(detail) {
    detail = detail.split("<h2>")
    let res = {}
    for (let i in detail) {
        let kv = detail[i].split("</h2>")
        if (kv.length == 2 && kv[0].trim() != "" && kv[1].trim() != "" && !/(天气)|(评论)|(地图)|(游览图)/.test(kv[0])) {
            let key = kv[0].trim().replace("：", "").replace(/(.*)门票价格/, "门票价格").replace("景区", "").replace("学校", ""),
                val = kv[1].trim().replace(/<(?:.|\s)*?>/g, "") //strip HTML Tag 
            res[key] = val
        }
    }
    return res
};

function parse(scenic) {
    let detail = parseDetail(scenic.txt.detail),
        qualify = (detail["资质"]) ? (detail["资质"]).split("、") : undefined,
        special = (detail["特色"]) ? detail["特色"].replace(/从您位置到.*卫星地图/, "").split("、") : null,
        address = (detail["位置"]) ? detail["位置"] : undefined

    let spot = {
        "poi": scenic.txt.id,
        "name": scenic.txt.name,
        "address": address,
        "adcode": "",
        "cls": "scenic",
        "alias": [scenic.txt.name],
        "scenic": {
            "star": scenic.txt.star || 0,
            "qualify": qualify || [],
            "special": special
        },
        "comment": {
            "want": _.toNumber(scenic.txt.want),
            "go": _.toNumber(scenic.txt.go),
        },
        "external": {
            "meet": {
                "id": scenic.txt.id,
                "name": scenic.txt.name,
                "src": "https://www.meet99.com" + scenic.txt.url,
                "crw": new Date().valueOf()
            }
        }
    }
    return spot
}


async function es2redis() {

    let db = new elastic("meet_ibc")
    let qs = dsl()
        .filter("match", "cls", "aoi")
        // .notFilter("range", "crw.amap", {
        //     gt: new Date().valueOf() - 8640000000
        // })
        .size(1000)
        .build();

    let res = await db.search(qs)
    let scenics = []
    for (let i in res) {
        let scenic = parse(res[i])
        if (scenic.address) {
            let district = await mdd.match(scenic.address)
            scenic.adcode = district.adcode
            scenic.address = scenic.address.replace(/>/g, "")
        }
        let kv = {}
        kv[scenic.poi] = JSON.stringify(scenic)
        scenics.push(kv)
    }
    await meet.hset(scenics)

};

async function upsert() {

    log(`upsert: is begin. `)

    let ids = await meet.hkeys(),
        chunks = _.chunk(ids, 1000)

    for (let i in chunks) {
        let res = await meet.hget(chunks[i])
        for (let j in res) {
            res[j].cls = "aoi"
            log(res[j].name)
           let o = await aoi.merge(res[j])
        //    log(o)
          
        }
    }
    log(`upsert: is done. `)
}

(async () => {
    // await es2redis()
    // await meet.hdump()
    await upsert()
    await aoi.hdump()
    _done()
    log("search done!")

    // let db = new elastic("scenics")
    // db.import("scenic.all.ndjson")
    // log("db import  done!")
})()
