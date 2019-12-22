/*
国家统计局权威数据
http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2018/
*/



const _ = require("lodash");

const config = require('config');

const jieba = require("nodejieba");
const chinese = require("../lib/chinese")
const fs = require("../lib/fs")
const misc = require("../lib/misc");
const log = misc.log

const Elastic = require("../lib/elastic");
const db = new Elastic("scenicss");

function normalizer(str) {
    str = str.replace(/\(.*\)/g, "")
    str = _.last(_.compact(str.split("-")))
    str = misc.clear(str)
    return str
}

function loaddic() {
    jieba.load(config.get("dict.scenics"));
}



function pickup(tags) {

    let picks = {}

    for (let i in tags) {
        if (!_.startsWith(tags[i].tag, '[')) continue
        let ids = JSON.parse(tags[i].tag),
            w = 1 / ids.length
        for (let id of ids)
            picks[id] = (picks[id]) ? {
                c: picks[id].c + 1,
                w: picks[id].w + w
            } : {
                c: 1,
                w: w
            }
    }

    let pick = _.reduce(picks, (result, value, id) => {
        if (result.length == 0 || value.w == result[0].value.w)
            result.push({
                id,
                value
            })
        else if (value.w > result[0].value.w)
            result = [{
                id,
                value
            }]
        return result

    }, [])

    // return (pick.length > 10 ) ? [] : pick
    return pick
}



let jds = [],
    add = []

// 地址信息管理
const jd = {
    load: (file) => {
        jds = []

        file = file || "./cache/scenics.ndjson"
        if (!fs.exist(file))
            return false


        jds = fs.read(file)
    },

    match: (str, adcode) => {
        if (!str) return ""
        // let picks = _.filter(jds, x => x.adcode == adcode)
        // let picks = jds

        let name = normalizer(str),
            tags = jieba.tag(name),
            picks = pickup(tags)

        log("=>", str)
        log(name)
        log(jieba.cut(name, true))
        log(picks)

    },

    buildDict: (file) => {

        file = file || "./cache/scenics.ndjson"
        if (!fs.exist(file))
            return false

        jieba.load(config.get("dict.jiebaScenic"));

        let keywords = {},
            count = 0

        lineFn = (line) => {
            let o = JSON.parse(line)
            let id = o.id,
                name = normalizer(o.name),
                tags = jieba.cut(name, true)

            if (count++ % 10000 == 0)
                log(count, o.name, "=>", name, "=>", tags)

            for (let key of tags)
                (keywords[key] || (keywords[key] = [])).push(id);
        }

        doneFn = () => {

            let scenics = _.reduce(keywords, (result, value, key) => {
                value = _.uniq(value)
                if (key != " " && key != "·")
                    result.push(`${key} 1 ${JSON.stringify(value)}`)
                // result.push(`${key} ${value.length} ${JSON.stringify(value)}`)
                return result;
            }, []);


            fs.write(config.get("dict.scenics.dict"), scenics.join("\n"))
            log("end")
        }

        log("start")
        fs.readline(file, lineFn, doneFn)
    }

}



module.exports = jd;

// jd.buildDict()
// jd.update()
// (async () => {
//     log("1")
//     await db.import("./cache/scenics.ndjson")
//     log("2")

// })()

// loaddic()
// log("start load")
// jd.load()
// log("end load")

jd.load()
log("start")
// // for (let i = 0; i < 100; i++)
jd.match("福建长门炮台")
log("end")

// log(jds.length)