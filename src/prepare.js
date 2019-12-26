process.env.DEBUG = "bany*"

const _ = require("lodash");
const log = require("debug")("bany-prepare:")
const dsl = require("bodybuilder"); //doc: https://bodybuilder.js.org/

const elastic = require("../lib/elastic")

/* 
    景区ID缓存
    db (elasticsearch :scenics) => cache (redis: ids)
 */
async function cacheIds() {

    let db = new elastic("scenics")
    let log = require("debug")("bany-prepare-ids:")
    let redis = require('../lib/redis')("ids");

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
        await redis.hset(res)
    })

    db.on("searchdone", () => {
        log("load data from elastic done.")
        redis.done()
    })

    log("load data form elastic...")
    db.search(qs)

};

/* 
    行政区域数据缓存
    db (elasticsearch :district) => cache (redis: district)
 */
async function cacheDistrict() {

    let db = new elastic("district")
    let log = require("debug")("bany-prepare-district:")
    let redis = require('../lib/redis')("district");

    let qs = dsl()
        .notFilter("match", "level", "street")
        .size(5000)
        .build();
    qs._source = ["id", "parent", "citycode", "adcode", "name", "level", "loc", "districts", "alias"]

    db.on("data", async (res) => {
        res = _.reduce(res, function (result, item) {
            if (item.id) {
                let o = {}
                o[item.id] = JSON.stringify(item)
                result.push(o)
            }
            return result;
        }, [])
        await redis.hset(res)
    })

    db.on("searchdone", () => {
        log("load data from elastic done.")
        redis.done()
    })

    log("load data form elastic...")
    db.search(qs)

};


/* 
    景区信息缓存
    db (elasticsearch :scenics) => cache (redis: scenics)
 */
async function cacheScenics() {

    let db = new elastic("scenics")
    let log = require("debug")("bany-prepare-scenics:")
    let redis = require('../lib/redis')("scenics");

    let qs = {
        "query": {
            "match_all": {}
        },
        size: 5000
    }

    qs._source = ["id", "aoi", "name", "address", "classify", "comment", "scenic", "adcode", "alias", "external"]

    db.on("data", async (res) => {

        res = _.reduce(res, function (result, item) {
            if (item.id) {
                let o = {}
                o[item.id] = JSON.stringify(item)
                result.push(o)
            }
            return result;
        }, [])
        await redis.hset(res)
    })

    db.on("searchdone", () => {
        log("load data from elastic done.")
        redis.done()
    })

    log("load data form elastic...")
    db.search(qs)

};



async function cacheMeets() {
    let db = new elastic("meet_ibc"),
        log = require("debug")("bany-prepare-meet:"),
        redis = require('../lib/redis')("meets"),
        ids = []

    let qs = dsl()
        .notFilter("match", "cls", "mdd")
        .size(5000)
        .build();

    db.on("data", async (res) => {

        res = _.reduce(res, function (result, item) {
            if (item.id) {
                let o = {}
                o[item.id] = JSON.stringify(item)
                result.push(o)
                ids.push(item.id)
            }
            return result;
        }, [])

        await redis.hset(res)
    })

    db.on("searchdone", async () => {
        log("load data from elastic done.")
        await redis.set("meetids", ids.join(","))
        redis.done()
    })

    log("load data form elastic...")
    db.search(qs)

};

(async () => {
    // await cacheIds()
    // await cacheDistrict()
    // await cacheScenics()
    await cacheMeets()
    // log(1)
    // let redis = require('../lib/redis')("scenics");
    // log(2)
    // await redis.hget(["3a9444d2c0c1"])
    // log(3)

})()