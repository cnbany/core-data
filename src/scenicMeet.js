process.env.DEBUG = "bany-scenic*"

const _ = require("loadsh"),
    fs = require('../lib/fs'),
    log = require("debug")("bany-scenic-meet:"),
    elastic = require("../lib/elastic")

let db = new elastic("meet_ibc")

function parse(detail) {

    detail = detail.split("<h2>")
    let res = []
    for (let i in detail) {
        let kv = detail[i].split("</h2>")
        if (kv.length == 2 && kv[0].trim() != "" && kv[1].trim() != "" && !/(天气)|(评论)|(地图)|(游览图)/.test(kv[0]))
            res.push({
                key: kv[0].trim().replace("：", "").replace(/(.*)门票价格/, "门票价格").replace("景区", "").replace("学校", ""),
                val: kv[1].trim().replace(/<(?:.|\s)*?>/g, "") //strip HTML Tag
            })
    }
    return res
};


// function run() {
//     let qs = dsl()
//         .filter("match", "cls", "aoi")
//         .notFilter("range", "crw.amap", {
//             gt: new Date().valueOf() - 8640000000
//         })
//         .size(1000)
//         .build();

//     db.search(qs)
// }


// step 1 : 数据预处理
async function getData() {
    log("(getData) begin at", new Date())

    let source = require('../lib/redis')("meets", "json"),
        scenics = (await source.get("meetids")).split(","),
        result = []
    // let scenics = await redis.hget("all"),
    log(`(getData) get list count:`, scenics.length)

    for (let i in scenics) {

        let scenic = await source.hget(scenics[i])

        // 详细信息分析
        let detail = parse(scenic.txt.detail)

        scenic.txt.intros = detail
        scenic.txt.img = _.uniqBy(scenic.txt.img, "url")
        scenic.txt.url = "https://www.meet99.com" + scenic.txt.url

        delete scenic.txt.detail
        delete scenic.txt.subpoi

        result.push(scenic.txt)
    }

    source.done()
    log("(getData) end at", new Date())
    return result
}

// step 2 : 获取 adcode 
async function getAdcode(scenics) {

    log("(getAdcode) begin at", new Date())
    let districts = require("./district");
    log("(getAdcode) load dictionary done!")

    for (let i in scenics) {
        let dz = scenics[i].intros.find(x => x.key == "位置")
        let district = await districts.match(dz.val)
        scenics[i].adcode = district.adcode
    }
    districts.done()
    log("(getAdcode) end at", new Date())
    return scenics
}

// step 3: 匹配景区信息
async function getScenic(scenics) {
    let scenic = require("./scenic");
    scenics = scenics || fs.read(`./cache/meet/meet.all.ndjson`)
    for (let i = 100; i < 150; i++) {
        let ma = await scenic.match(scenics[i].name, scenics[i].adcode)
        log(i)
    }
    scenic.done()
}



//cache meet data
(async () => {
    // let res = await getData()
    // res = await getAdcode(res)
    await getScenic()
    // 保存一个ndjson文件
    // fs.write(`./cache/meet/meet.all.ndjson`, res)
    log("save done!")


    log(1)
})()