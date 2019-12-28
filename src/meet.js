process.env.DEBUG = "bany-scenic*"

const _ = require("loadsh"),
    fs = require('../lib/fs'),
    log = require("debug")("bany-scenic-meet:"),
    dsl = require("bodybuilder"), //doc: https://bodybuilder.js.org/
    mdd = require("./bany/district"),
    poi = require("./bany/scenic"),
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

async function parse(scenic) {
    let detail = parseDetail(scenic.txt.detail),
        qualify = (detail["资质"]) ? (detail["资质"]).split("、") : undefined,
        special = (detail["特色"]) ? detail["特色"].replace(/从您位置到.*卫星地图/, "").split("、") : null,
        district = await mdd.match(detail["位置"])

    let spot = {
        "name": scenic.txt.name,
        "district": (district) ? district.adcode : undefined,
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
            "meet99": {
                "id": scenic.txt.id,
                "name": scenic.txt.name,
                "src": "https://www.meet99.com" + scenic.txt.url
            }
        }
    }
    return spot
}


function run() {
    let qs = dsl()
        .filter("match", "cls", "aoi")
        .notFilter("range", "crw.amap", {
            gt: new Date().valueOf() - 8640000000
        })
        .size(10)
        .build();

    let count = 0

    db.on("data", async (res) => {
        for (let i in res) {
            let scenic = await parse(res[i])
            // log(scenic)
            if (count++ % 100 == 0)
                log(count)
            await poi.merge(scenic)
        }
    })

    db.on("searchdone", () => {
        mdd.done()
        poi.done()
        log("search done!")
    })

    db.search(qs)
}



//cache meet data
(async () => {

    await run()

})()