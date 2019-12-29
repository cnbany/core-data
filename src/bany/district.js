/*
国家统计局权威数据
http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2018/
*/

process.env.DEBUG = "bany*"
const _level = ["country", "province", "city", "district", "street"]



const _ = require("lodash");
const fs = require("../../lib/fs")

const log = require("debug")("bany-distric:")

const jieba = require("nodejieba");
const redis = require('../../lib/redis')("district", "json");
const config = require('config');
const chinese = require("../../lib/chinese")
const elastic = require("../../lib/elastic");
const db = new elastic("district")

loaddic = () => jieba.load(config.get("dict.districts"));
loaddic()



function _keyword(str) {

    let _postfix = ["自治县", "自治州", "自治区", "自治旗", "城区", "地区", "林区", "省", "市", "区", "县", "镇", "乡", "旗"]
    let _nation = ["瑶族", "蒙古族", "回族", "藏族", "苗族", "维吾尔族", "彝族", "壮族", "布依族", "白族", "朝鲜族", "侗族", "哈尼族", "哈萨克族", "满族", "土家族", "瑶族", "达斡尔族", "东乡族", "高山族", "景颇族", "柯尔克孜族", "拉祜族", "纳西族", "畲族", "傣族", "黎族", "傈僳族", "仫佬族", "羌族", "水族", "土族", "佤族", "阿昌族", "布朗族", "毛南族", "普米族", "撒拉族", "塔吉克族", "锡伯族", "仡佬族", "保安族", "德昂族", "俄罗斯族", "鄂温克族", "京族", "怒族", "乌孜别克族", "裕固族", "独龙族", "鄂伦春族", "赫哲族", "基诺族", "珞巴族", "门巴族", "塔塔尔族", "汉族"]

    let rePostfix = new RegExp(`(${_postfix.join("|")})$`, 'g')
    let reNation = new RegExp(`(${_nation.join("|")})`, 'g')

    return str.replace(reNation, '').replace(rePostfix, '')
}

function _normal(str) {

    if (typeof (str) != 'string')
        str = JSON.stringify(str)

    //处理无用字符
    str = str.replace(/>/g, "").replace(/ /g, "")

    //处理繁体字

    // if (chinese.ist(str))
    //     str = chinese.t2s(str)
    return str
}

function _pickup(picks) {

    if (!Array.isArray(picks) || picks.length == 0) return ""

    //设置加权因子

    let factor = {}

    for (let i in picks) {
        let weight = picks[i].w
        // let id = res[i].id
        for (let key in picks[i].districts) {
            let id = picks[i].districts[key].id
            if (id != "c222ae14")
                factor[id] = (factor[id]) ? (factor[id] + weight) : weight
        }
    }

    //计算权重

    for (let i in picks) {
        for (let key in picks[i].districts) {
            let id = picks[i].districts[key].id
            if (factor[id]) {
                if (!picks[i].weight)
                    picks[i].weight = 0
                picks[i].weight += factor[id]
            }
        }
    }
    //按权重排序

    picks = _.orderBy(picks, "weight", "desc")

    return picks[0].id
}

async function _get(keys) {

    let res = await redis.hget(keys)

    return res
}


// 地址信息管理

let district = {
    done: () => {
        redis.done()
    },

    get: async function (keys) {
        return await redis.hget(keys)
    },

    match: async function (location) {

        if (!location) return {}

        // 对文本进行预处理
        location = _normal(location)

        //分词
        let tags = jieba.tag(location),
            picks = []

        // 挑选关键词，并设置初始权重

        for (let i in tags) {
            if (tags[i].tag[0] == "[") {
                let o = JSON.parse(tags[i].tag)
                o = _.flatMap(o, x => {
                    return {
                        id: x,
                        w: (1 / o.length)
                    }
                })
                picks.push(...o)
            }
        }

        if (picks.length == 0) return {}

        // 查询所有相关行政区记录信息

        let ids = _.flatMap(picks, "id")
        // let districts = _.filter(dzs, x => ids.indexOf(x.id) >= 0)

        let districts = await redis.hget(ids)

        for (let i in picks)
            picks[i].districts = _.find(districts, x => x.id == picks[i].id).districts || {}

        //只有一条记录时直接返回数据

        if (districts.length == 1) return districts[0]

        // 根据权重挑选,返回数据
        let pickid = _pickup(picks, districts)
        let district = _.find(districts, x => x.id == pickid)

        return district
    },

    dict: async function () {

        let keys = {}
        let dzs = await redis.hget()
        for (let i in dzs) {

            let name = dzs[i].name
            let kw = _keyword(name)

            if (!keys[name]) keys[name] = []

            keys[name].push(dzs[i].id)

            if (kw != name && kw.length > 1)
                (keys[kw]) ? keys[kw].push(dzs[i].id) : keys[kw] = [dzs[i].id]
        }

        let dicts = []
        for (let key in keys) {
            let tag = "",
                freq = 1,
                count = _level.length

            dicts.push(`${key} ${freq} ${JSON.stringify(keys[key])}`)
        }


        fs.write("./res/jieba_district.utf8", dicts.join("\n"))
        log(`[./res/jieba_district.utf8] dict is builded`)

        loaddic()
    }

}


module.exports = district;

// (async () => {
//     log(await district.match("保定"))
//     // log(await redis.hget("7e6b9c4e"))
//     // log(await redis.hget(["aa4ff08c","a4f748c2","376fb3ac","908965b3"]))

// })()
//     msdz.dict()

//     // let a = await get("7e6b9c4e")
//     // console.log(a)



//     // log(a.mget(["aa4ff08c","a4f748c2","376fb3ac","908965b3"]))

//     // const redis = require('../lib/redis')("test");
//     // let b = redis.hget(["B0FFH70TP6","B0FFFADBHE","B0FFJID5CQ","B0FFFOUKGF","B0FFILICT3","B0FFG4H4H4","B0FFGY930S","B000ABCM6I","B0FFHCP8XN","B0FFIAMJ1C","B0FFH9BWJG","B0FFKJ9P0J","B0FFI7TMO3","B0FFG72MCG","B0FFH13J07","B0FFG738ZF","B0FFINENCX","B0FFJOEMIF","B0FFG8UQGG","B0FFHC96MH","B0FFINO7OI","B0FFG8VQN7","B0FFIOUUIN","B0FFIH4MX3","B0FFHJI36P","B0FFIL91ZZ","B0FFG8VP1X","B0FFH8SJ3D","B0FFJKIKKJ","B000A80SX1","B000A87WVZ","B0FFHJ4QWP","B000A7OVNL","B0FFGJU8US"])
//     // log(b)

//     // let address = require("../cache/address.json")
//     // let now = new Date()
//     // for (let i in address) {
//     //     let res = a.match(address[i])
//     //     if (i != 0 && i % 10000 == 0) {
//     //         let last = new Date()
//     //         console.log(`no.${i} : Average use ${((last - now) / 10000).toFixed(2)}ms current txt is ${address[i]}`)
//     //         now = last
//     //         misc.log(res)
//     //     }
//     // }
//     // a.save()
// })()

//结果格式： 
/*{
    "id": "7e6b9c4e",
    "parent": "ce1e56e7",
    "citycode": "0455",
    "adcode": "231282",
    "name": "肇东市",
    "alias": ["肇东"],
    "level": "district",
    "loc": "125.991402,46.069471",

    "districts": {
        "district": {"id": "7e6b9c4e", "name": "肇东市", "adcode": "231282"},
        "city":     {"id": "ce1e56e7","name": "绥化市","adcode": "231200"},
        "province": { "id": "0c88d7ea","name": "黑龙江省","adcode": "230000"},
        "country":  {"id": "c222ae14","name": "中华人民共和国","adcode": "100000"}
    },

    "external": {
        "csrip":{"src": "https://you.ctrip.com/place/zhaodong2246.html","name": "肇东", "mdd": "zhaodong2246"},
        "meet": {"name": "肇东市","mdd": "zhaodong","url": ["https://www.meet99.com/lvyou-zhaodong.html","https://www.meet99.com/maps/loadchild/lvyou/suihua"]},
        "mfw":  {"parent": "34385","name": "肇东","mdd": "143839","enname": "Zhaodong","gone": "1338"}
    }
} */