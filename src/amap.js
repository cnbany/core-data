process.env.DEBUG = "bany-scenic*"

const _ = require("loadsh"),
    fs = require('@cnbany/fs'),
    log = require("debug")("bany-scenic-amap:"),
    ids = require("./bany/ids"),
    mdd = require("./bany/district"),
    aoi = require("./bany/scenic"),
    chinese = require("../lib/chinese"),
    timestamp = require("debug")("bany-scenic-timestamp")


async function _done() {
    timestamp("dump start")
    await aoi.hdump()
    ids.done()
    mdd.done()
    aoi.done()
    timestamp("dump end")
};

async function parse(scenic) {

    let hasScenic = (scenic.scenic) ? true : false,
        poi = scenic.base.poiid,
        aois = _.flatMap(scenic.base.geodata.aoi, "mainpoi"),
        name = scenic.base.name,
        address = scenic.base.address,
        cls = "norm",
        intro = [],
        point = {
            "lon": scenic.base.x,
            "lat": scenic.base.y
        }

    let id = await ids.hget(poi)
    let district = await mdd.match(address)


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
        id,
        "name": scenic.base.name,
        // poi,
        cls, //aoi:景区  poi:景点
        aois,
        address,
        adcode: district.adcode,

        // "alias": [],
        "cover": (scenic.pic_cover) ? scenic.pic_cover.url : "",
        "classify": scenic.base.tag,
        "theme": (scenic.deep) ? scenic.deep.tag_category : "",
        // districts : district.districts,

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
                "name": scenic.base.name,
                "src": "https://www.amap.com/detail/" + poi,
                "crw": new Date().valueOf()
            }
        }
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
        // spot.desc = scenic.scenic.intro
    }

    return spot
};


async function files2redis() {

    timestamp("files2redis start")

    let idslist = await ids.hget("all")

    let opt = 'w',
        files = fs.glob("../cache/source/amap/*_scenic_raw.json")

    for (let i in files) {

        let t2s = false
        if (files[i].indexOf("710000") >= 0 || files[i].indexOf("810000") >= 0 || files[i].indexOf("820000") >= 0)
            t2s = true

        let pois = fs.read(files[i], 'ndjson'),
            scenics = []

        log(`process No.${_.toNumber(i)+1} file [${fs.basename(files[i])}] count: ${pois.length}`)

        for (let poi of pois) {
            if (t2s)
                poi = JSON.parse(chinese.t2s(JSON.stringify(poi)))

            let scenic = await parse(poi)

            let parent = []
            for (let i in scenic.aois) {
                if (idslist[scenic.aois[i]]) parent.push(scenic.aois[i])
            }
            scenic.aois = (parent.length > 0) ? await ids.hget(parent) : []

            let kv = {}
            kv[scenic.id] = JSON.stringify(scenic)
            scenics.push(kv)
        }
        await aoi.hset(scenics)
    }
    timestamp("files2redis end")
};


(async () => {
    await files2redis()
    await _done()
})()