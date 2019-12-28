process.env.DEBUG = "bany*"

const _ = require("loadsh"),
    fs = require('../lib/fs'),
    log = require("debug")("bany-scenic-amap:"),
    redis = require("../lib/redis")("amap", "json"),
    chinese = require("../lib/chinese")

function parse(scenic) {

    let hasScenic = (scenic.scenic) ? true : false,
        poi = scenic.base.poiid,
        aois = scenic.base.geodata.aoi,
        name = scenic.base.name,
        cls = "norm",
        intro = [],
        point = {
            "lon": scenic.base.x,
            "lat": scenic.base.y
        }

    let shape = (scenic.spec.mining_shape && scenic.spec.mining_shape.shape) ? scenic.spec.mining_shape.shape : undefined

    let image = _.compact(_.flatMap(scenic.pic, (it) => {
        let url = it.url
        let height = it.srcheight ? _.toNumber(it.srcheight) : 0
        let width = it.srcwidth ? _.toNumber(it.srcwidth) : 0
        if (height > width)
            return {
                name,
                "src": "amap",
                type: "image",
                height,
                width,
                url
            }
    }))

    if (hasScenic) {
        if (scenic.scenic.intro)
            intro.push({
                title: "intro",
                txt: scenic.scenic.intro.trim()
            })

        if (scenic.scenic.midea_info && scenic.scenic.midea_info.scenic_txt_tts)
            intro.push({
                title: "guide",
                txt: scenic.scenic.midea_info.scenic_txt_tts.trim()
            })

        if (scenic.scenic.special)
            intro.push({
                title: "special",
                txt: scenic.scenic.special.trim()
            })
    }

    if (shape) cls = "aoi"
    else if (aois && aois.indexOf(poi) >= 0) cls = "aoi"
    else if (aois && aois.length > 0) cls = "poi"
    else if (!hasScenic) cls = "noop"

    let spot = {
        poi,
        cls, //aoi:景区  poi:景点
        aois,
        "name": scenic.base.name,
        // "alias": [],
        "cover": (scenic.pic_cover) ? scenic.pic_cover.url : "",
        "classify": scenic.base.tag,
        "theme": (scenic.deep) ? scenic.deep.tag_category : "",
        "address": scenic.base.address,

        "onmap": {
            point,
            "shape": (shape) ? true : false,
            "level": (scenic.spec.mining_shape) ? scenic.spec.mining_shape.level : 18,
            // "icon": null
        },
        "comment": {},
        "resource": {
            images: image.length
        },
        "external": {
            "amap": {
                "id": poi,
                "src": "https://www.amap.com/detail/" + poi
            }
        },
        intros: intro,
        images: image,
        shape: shape
    }
    if (intro) spot.intros = intro
    if (image) spot.images = image
    if (shape) spot.shapes = shape

    if (hasScenic) {
        spot.scenic = {
            "star": (scenic.scenic.level) ? scenic.scenic.level.length : 0,
            "peoples": (scenic.scenic.client) ? _.compact(scenic.scenic.client.split("|")) : [],
        }
        spot.comment.score = _.toNumber(scenic.scenic.src_star)
        spot.desc = scenic.scenic.intro
    }

    return spot
};

async function output(file) {

    let ids = await redis.get("amapids")
    if (!ids || ids.length == 0) return

    ids = ids.split(",")
    let opt = 'w',
        chunks = _.chunk(ids, 10000)
    file = file || "./cache/amap.all.ndjson"

    for (let i in chunks) {
        let res = await redis.hget(chunks[i])
        fs.write(file, res, opt, "ndjson")
        if (opt == 'w') opt = 'a'
    }
    redis.done()
}


async function input() {

    let opt = 'w',
        files = fs.glob("../cache/source/amap/*_scenic_raw.json"),
        ids = []

    for (let i in files) {
        // if (files[i].indexOf("340000") >= 0) { //测试单个文件用
        let t2s = false

        if (files[i].indexOf("710000") >= 0 || files[i].indexOf("810000") >= 0 || files[i].indexOf("820000") >= 0)
            t2s = true

        // if (!t2s) continue

        let pois = fs.read(files[i], 'ndjson'),
            scenics = []

        log(`process No.${_.toNumber(i)+1} file [${fs.basename(files[i])}] count: ${pois.length}`)

        for (let poi of pois) {
            if (t2s)
                poi = JSON.parse(chinese.t2s(JSON.stringify(poi)))

            let scenic = await parse(poi)
            let kv = {}
            kv[scenic.poi] = JSON.stringify(scenic)
            scenics.push(kv)
            ids.push(scenic.poi)
        }

        await redis.hset(scenics)
    }
    ids = _.union(ids)
    await redis.set("amapids", ids.join(","))

    // await output(ids)
    redis.done()
}


(async () => {
    await output()
    redis.done()
})()