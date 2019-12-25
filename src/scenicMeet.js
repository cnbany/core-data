process.env.DEBUG = "bany*"
const _ = require("loadsh")

const fs = require('../lib/fs');
const log = require("debug")("bany-scenic-meet:")
const dist = require("./district");
const redis = require('../lib/redis')("meet", "json");

String.prototype.stripHTML = function () {
    var reTag = /<(?:.|\s)*?>/g;
    return this.replace(reTag, "");
}


// const idms = new Idms("scenics", 12)


function parse(detail) {

    detail = detail.split("<h2>")
    let res = []
    for (let i in detail) {
        let kv = detail[i].split("</h2>")
        if (kv.length == 2 && kv[0].trim() != "" && kv[1].trim() != "" && !/(天气)|(评论)|(地图)|(游览图)/.test(kv[0]))
            res.push({
                key: kv[0].trim().replace("：", "").replace(/(.*)门票价格/, "门票价格").replace("景区", "").replace("学校", ""),
                val: kv[1].trim().stripHTML()
            })
    }
    return res
};


function save(result) {
    let opt = 'w'
    let first = true
    for (let key of Object.keys(result)) {
        // console.log(result[key].length)
        fs.write(`./cache/meet/meet.all.ndjson`, result[key], opt)
        if (opt == 'w') opt = 'a'
    }
}

function group(result) {

    for (let key of Object.keys(result)) {
        // console.log(result[key].length)
        fs.write(`./cache/meet/meet.${key}.ndjson`, result[key])
    }
};

(async () => {

    let scenics = await redis.hget("all")
    let result = []
    for (let i in scenics) {
        if (i != 0 && i % 100 == 0)
            console.log(i + ":" + scenics[i].txt.name)
        // 详细信息分析
        let detail = parse(scenics[i].txt.detail)
        let dd = detail.find(x => x.key == "位置")
        // 获取标准行政区信息
        let district = await dist.match(dd.val)
        // if (district && district.districts && district.districts.country) delete district.districts.country
        // delete scenics[i].txt.detail
        // delete scenics[i].txt.subpoi
        // delete scenics[i].txt.crw
        scenics[i].txt.img = _.uniqBy(scenics[i].txt.img, "url")
        scenics[i].txt.url = "https://www.meet99.com" + scenics[i].txt.url

        scenics[i].txt.intros = detail

        scenics[i].txt.adcode = district.adcode
        scenics[i].txt.districts = district.districts


        // 按省份分组
        result.push(scenics[i].txt)
    }


    // 保存一个ndjson文件
    save(result)
    // console.log(1)

})()

//cache meet data
// (async ()=>{
//   await  cacheMeets()
// })()