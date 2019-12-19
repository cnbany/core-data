const url = require("url");
const _ = require("lodash");

const fs = require('../../libs/fs');
const misc = require('../../libs/misc');
const Msid = require("../msid");
const Msdz = require("../msdz");




// const idms = new Idms("scenics", 12)


const log = misc.log,
    scenicid = new Msid("scenic"),
    msdz = new Msdz()

function group( file = "./cache/scenics.ndjson") {
    let result = {}
    let scenics = fs.read(file)
    for (let i in scenics) {
        let key = (scenics.districts && scenics.districts.province) ? scenics.districts.province.adcode : "000000"

        if (!result.hasOwnProperty(key)) result[key] = []

        result[key].push(scenics[i])
    }

    
    for (let key in result) {
        // console.log(result[key].length)
        fs.write(`./cache/amap/amap.${key}.ndjson`, result[key])
    }
}

function parse(scenic) {
    let ret = {}
    let hasScenic = (scenic.scenic) ? true : false

    let poi = scenic.base.poiid
    let aois = scenic.base.geodata.aoi
    let name = scenic.base.name
    let point = {
        "lon": scenic.base.x,
        "lat": scenic.base.y
    }

    let id = scenicid.get(poi)

    let scenicids = _.flatMap(aois, (it) => {
        return scenicid.get(it.mainpoi)
    })

    ret.shape = (scenic.spec.mining_shape && scenic.spec.mining_shape.shape) ? {
        id,
        shape: scenic.spec.mining_shape.shape
    } : null

    ret.image = _.compact(_.flatMap(scenic.pic, (it) => {
        let url = it.url
        let height = it.srcheight ? _.toNumber(it.srcheight) : 0
        let width = it.srcwidth ? _.toNumber(it.srcwidth) : 0
        if (height > width)
            return {
                id,
                name,
                "src": "amap",
                type: "image",
                height,
                width,
                url
            }
    }))


    ret.intro = []
    if (hasScenic) {
        if (scenic.scenic.intro)
            ret.intro.push({
                id,
                name,
                title: "intro",
                txt: scenic.scenic.intro.trim()
            })
        if (scenic.scenic.midea_info && scenic.scenic.midea_info.scenic_txt_tts)
            ret.intro.push({
                id,
                name,
                title: "guide",
                txt: scenic.scenic.midea_info.scenic_txt_tts.trim()
            })
        if (scenic.scenic.special)
            ret.intro.push({
                id,
                name,
                title: "special",
                txt: scenic.scenic.special.trim()
            })
    }


    let cls = "norm"
    if (ret.shape) cls = "aoi"
    else if (scenicids.indexOf(id) >= 0) cls = "aoi"
    else if (scenicids.length > 0) cls = "poi"
    else if (!hasScenic) cls = "noop"

    ret.scenic = {
        id,
        cls, //aoi:景区  poi:景点
        "aoi": scenicids,
        "name": scenic.base.name,
        // "alias": [],
        "cover": (scenic.pic_cover) ? scenic.pic_cover.url : "",
        "classify": scenic.base.tag,
        "theme": (scenic.deep) ? scenic.deep.tag_category : "",
        "address": scenic.base.address,

        "onmap": {
            point,
            "shape": (ret.shape) ? true : false,
            "level": (scenic.spec.mining_shape) ? scenic.spec.mining_shape.level : 18,
            // "icon": null
        },
        "comment": {},
        "resource": {
            images: ret.image.length
        },
        "external": {
            "amap": {
                "id": poi,
                "src": "https://www.amap.com/detail/" + poi
            }
        },

    }

    if (hasScenic) {
        ret.scenic.scenic = {
            "star": (scenic.scenic.level) ? scenic.scenic.level.length : 0,
            "peoples": (scenic.scenic.client) ? _.compact(scenic.scenic.client.split("|")) : [],
        }
        ret.scenic.comment.score = _.toNumber(scenic.scenic.src_star)
        ret.scenic.desc = scenic.scenic.intro
    }

    return ret
};


(async () => {

    await scenicid.load()
    await msdz.load()

    let count = 0,
        opt = 'w',
        now = new Date().valueOf(),
        fnow = now

    let files = fs.glob("cache/source/amap/*_scenic_raw.json");
    for (let i in files) {
        // if (files[i].indexOf("340000") >= 0) { //测试单个文件用
        let pois = fs.read(files[i], 'ndjson')
        if (i > 0) {
            let flast = new Date().valueOf()
            log(`process file [${fs.basename(files[i - 1])}]`)
            fnow = flast
        }

        let scenics = [],
            intros = [],
            images = [],
            shapes = []
        for (let j in pois) {
            if (++count % 5000 == 0) {
                let last = new Date().valueOf()
                log(`${last - now} : process ${count} .\t No.${_.toNumber(i) + 1} file [${fs.basename(files[i])}] ${_.toNumber(j) + 1}`)
                now = last
            }

            let {
                scenic,
                intro,
                image,
                shape
            } = await parse(pois[j])
            if (scenic) {
                //!!添加区号信息
                let dz = msdz.match(scenic.address)
                if (dz && dz.districts) {
                    scenic.adcode = dz.adcode
                    scenic.districts = dz.districts
                } else log(scenic.address + " address not found!")

                scenics.push(scenic)
            }

            if (image.length > 0) images = images.push(...image)
            if (intro.length > 0) intros = intros.push(...intro)
            if (shape) shapes.push(shape)
        }

        scenics = _.orderBy(scenics, ["cls", "scenic.star", "comment.score"], ["asc", "desc", "desc"])

        fs.write("./cache/scenics.ndjson", scenics, opt)
        fs.write("./cache/intros.ndjson", intros, opt)
        fs.write("./cache/images.ndjson", images, opt)
        fs.write("./cache/shapes.ndjson", shapes, opt)
        if (opt == 'w') opt = 'a'
        // }//测试单个文件用
    }

    await scenicid.save()
    
})()