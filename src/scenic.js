/*
国家统计局权威数据
http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2018/
*/
process.env.DEBUG = "bany*"


const _ = require("lodash");

const config = require('config');

const jieba = require("nodejieba");
const chinese = require("../lib/chinese")
const fs = require("../lib/fs")
const misc = require("../lib/misc");
const log = require("debug")("bany-scenic:")
const redis = require('../lib/redis')("scenics", "json");
const elastic = require("../lib/elastic");
const db = new elastic("scenics");


loaddic = () => jieba.load(config.get("dict.scenics"));
loaddic()


// let dict = config.get("dict.scenics")
function _normal(str) {
    str = str.replace(/\(.*\)/g, "")
    str = _.last(_.compact(str.split("-")))
    str = misc.clear(str)
    return str
}




function _pickup(tags, adcode) {


    adcode = (adcode) ? adcode.replace("0", "") : null
    let picks = {}

    for (let i in tags) {
        if (!_.startsWith(tags[i].tag, '[')) continue
        let ids = JSON.parse(tags[i].tag)

        // if (adcode)
        //     ids = _.filter(ids, x => _.startsWith(x.id, adcode))

        ids = _.flatMap(ids, x => x.split(":")[1])

        let w = (ids.length > 0) ? 1 / ids.length : 0

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




let scenic = {
    get: async function (keys) {
        return await redis.get(keys)
    },

    match: async (str, opt) => {
        if (!str) return ""
        // let picks = _.filter(jds, x => x.adcode == adcode)
        // let picks = jds

        let adcode = (opt && opt.adcode) ? opt.adcode : null
        let loc = (opt && opt.loc) ? opt.loc : null

        let name = _normal(str),
            tags = jieba.tag(name),
            picks = _pickup(tags, adcode),
            ids = _.map(picks, (x) => x.id),
            scenics = await redis.get(ids)

        log("=>", str)
        log(name)
        log(jieba.cut(name, true))
        log(picks)
        log(ids)
        log(scenics)
    },

    dict: async (file) => {

        jieba.load(config.get("dict.jiebaScenic"));

        let keywords = {},
            count = 0

        let scenics = await redis.get("all")

        lineFn = (o) => {
            let id = o.id,
                adcode = o.adcode,
                name = _normal(o.name),
                tags = jieba.cut(name, true)

            if (count++ % 10000 == 0)
                log(count, o.name, "=>", name, "=>", tags)

            for (let key of tags)
                (keywords[key] || (keywords[key] = [])).push(adcode + ":" + id);
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

        for (let i in scenics)
            lineFn(scenics[i])
        doneFn()

    }

}



module.exports = scenic;

// jd.buildDict()
// jd.update()
(async () => {
    // log(await scenic.get(["fe6de9c3e7eb","d93e6d5408d4"]))

    await scenic.match("三门峡天鹅湖国家城市湿地公园", {
        adcode: "411300"
    })
    // await scenic.dict()


})()




/*

*/
// loaddic()
// log("start load")
// jd.load()
// log("end load")

// jd.load()
// log("start")
// // // for (let i = 0; i < 100; i++)
// jd.match("福建长门炮台")
// log("end")

// log(jds.length)