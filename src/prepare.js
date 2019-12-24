process.env.DEBUG = "bany*"

const _ = require("lodash");
const log = require("debug")("bany-prepare:")
const dsl = require("bodybuilder"); //doc: https://bodybuilder.js.org/

const elastic = require("../lib/elastic")

/* 
    景区ID缓存
    db (elasticsearch :scenics) => cache (redis: ids)
 */
async function preMsid() {
    const log = require("debug")("bany-prepare-msid:")
    let redis = require('../lib/redis')("ids");
    let db = new elastic("scenics")

    let qs = {
        "query": {
            "match_all": {}
        },
        size: 5000,
        _source: ["id", "external"]
    }

    db.on("data", async (res) => {
        res = _.reduce(res, function (result, item) {
            if (item.external && item.external.amap) {
                let o = {}
                o[item.external.amap.id] = item.id
                result.push(o)
            }
            return result;
        }, [])
        await redis.set(res)
    })

    db.search(qs)

};

/* 
    行政区域数据缓存
    db (elasticsearch :district) => cache (redis: district)
 */
async function preMsdz() {
    const log = require("debug")("bany-prepare-msdz:")
    let db = new elastic("district")
    let redis = require('../lib/redis')("district");

    let qs = dsl()
        .notFilter("match", "level", "street")
        .size(5000)
        .build();
    qs._source = ["id", "parent", "citycode", "adcode", "name", "level", "loc", "districts", "alias"]

    db.on("data", async (res) => {
        res = _.reduce(res, function (result, item) {
            if (item.adcode) {
                let o = {}
                o[item.adcode] = JSON.stringify(item)
                result.push(o)
            }
            return result;
        }, [])
        await redis.set(res)
    })

    db.on("searchdone", () => {
        log("load data from elastic done.")
    })

    log("load data form elastic...")
    db.search(qs)

};


(async () => {
    await preMsid()
    await preMsdz()
})()