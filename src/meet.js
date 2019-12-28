process.env.DEBUG = "bany*"

const _ = require("loadsh"),
    fs = require('../lib/fs'),
    log = require("debug")("bany-scenic-meet:"),
    redis = require("../lib/redis")("meet", "json")
dsl = require("bodybuilder"), //doc: https://bodybuilder.js.org/
    elastic = require("../lib/elastic")


let db = new elastic("meet_ibc")

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
        "class": "scenic",
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
                "src": "https://www.meet99.com" + scenic.txt.url
            }
        }
    }
    return spot
}



async function output(file) {

    let ids = await redis.get("meetids")
    if (!ids || ids.length == 0) return

    ids = ids.split(",")
    let opt = 'w',
        chunks = _.chunk(ids, 10000)
    file = file || "./cache/meet.all.ndjson"

    for (let i in chunks) {
        let res = await redis.hget(chunks[i])
        fs.write(file, res, opt, "ndjson")
        if (opt == 'w') opt = 'a'
    }
    redis.done()
}


//cache meet data
async function input() {

    let count = 0,
        ids = []
    let qs = dsl()
        .filter("match", "cls", "aoi")
        // .notFilter("range", "crw.amap", {
        //     gt: new Date().valueOf() - 8640000000
        // })
        .size(1000)
        .build();

    db.on("data", async (res) => {

        let scenics = []
        for (let i in res) {
            let scenic = parse(res[i])
            let kv = {}
            kv[scenic.poi] = JSON.stringify(scenic)
            scenics.push(kv)
            ids.push(scenic.poi)
        }
        await redis.hset(scenics)
    })

    db.on("searchdone", async () => {
        ids = _.union(ids)
        await redis.set("meetids", ids.join(","))
        redis.done()
        log("search done!")
    })

    db.search(qs)
};


(async () => {
    output()
})()