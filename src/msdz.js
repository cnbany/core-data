/*
国家统计局权威数据
http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2018/
*/


const dsl = require("bodybuilder"); //doc: https://bodybuilder.js.org/

const _ = require("lodash");


const _level = ["country", "province", "city", "district", "street"]

const config = require('config');
const jieba = require("nodejieba");
const chinese = require("../libs/chinese")
const ES = require("../libs/elastic");
const misc = require("../libs/misc");
const log = misc.log

const fs = require("../libs/fs")

const db = new ES("district")



function loaddic() {
    jieba.load(config.get("dict.districts"));
}
loaddic()

function keyword(str) {

    let _postfix = ["自治县", "自治州", "自治区", "自治旗", "城区", "地区", "林区", "省", "市", "区", "县", "镇", "乡", "旗"]
    let _nation = ["瑶族", "蒙古族", "回族", "藏族", "苗族", "维吾尔族", "彝族", "壮族", "布依族", "白族", "朝鲜族", "侗族", "哈尼族", "哈萨克族", "满族", "土家族", "瑶族", "达斡尔族", "东乡族", "高山族", "景颇族", "柯尔克孜族", "拉祜族", "纳西族", "畲族", "傣族", "黎族", "傈僳族", "仫佬族", "羌族", "水族", "土族", "佤族", "阿昌族", "布朗族", "毛南族", "普米族", "撒拉族", "塔吉克族", "锡伯族", "仡佬族", "保安族", "德昂族", "俄罗斯族", "鄂温克族", "京族", "怒族", "乌孜别克族", "裕固族", "独龙族", "鄂伦春族", "赫哲族", "基诺族", "珞巴族", "门巴族", "塔塔尔族", "汉族"]

    let rePostfix = new RegExp(`(${_postfix.join("|")})$`, 'g')
    let reNation = new RegExp(`(${_nation.join("|")})`, 'g')

    return str.replace(reNation, '').replace(rePostfix, '')
}

/* 
行政区，地址信息管理

syncdown : 刷新本地缓存数据  elastic(src) => mem => file
syncup : 
upload(data):  更新服务器数据  params => elastic

// sync(dirct => down) : 向下同步数据  elastic => mem => file
// sync(dirct => up)   : 向上同步数据  mem =>  elastic

load(auto) : 加载  file/elastic => mem
dump : 加载  mem => file

get :   district key => return data
set :   add amap key, id  => mem

match:  
 */


function pickup(picks) {

    if (!_.isArray(picks) || picks.length == 0) return ""

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


let dzs = [],
    add = []

// 地址信息管理
function msdz() {
    this.path = "./cache/districts.ndjson"
}


msdz.prototype.load = async function (auto = true) {

    // auto 模式: 一天更新一次
    let bsync = false
    if (!fs.exist(this.path))
        bsync = true
    else if (!auto)
        bsync = false
    else {
        let now = new Date()
        let info = fs.info(this.path)
        if (now.getDate() - info.mtime.getDate() >= 1) bsync = true
    }

    if (bsync) {
        let qs = dsl()
            .notFilter("match", "level", "street")
            .size(5000)
            .build();
        qs._source = ["id", "parent", "citycode", "adcode", "name", "level", "loc", "districts", "alias"]
        dzs = await db.search(qs)
        log("load data from elastic.")
        this.save()
    } else {
        dzs = fs.read(this.path, 'ndjson')
        log(`load data from file [${this.path}].`)
    }
};

msdz.prototype.save = async function () {
    // mem => file[]
    let data = dzs
    data.push(...add)
    fs.write(this.path, data, 'ndjson')


    //mem => elastic
    if (add.length > 0)
        await db.bulk(add)
    else
        log("no new data.")
};

msdz.prototype.match = function (location) {

    // 对文本进行预处理

    if (!location) return {}

    if (typeof (location) != 'string')
        location = JSON.stringify(location)

    //处理无用字符

    location = location.replace(/>/g, "").replace(/ /g, "")

    //处理繁体字

    if (chinese.ist(location))
        location = chinese.t2s(location)

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
    let districts = _.filter(dzs, x => ids.indexOf(x.id) >= 0)

    for (let i in picks)
        picks[i].districts = _.find(districts, x => x.id == picks[i].id).districts || {}

    //只有一条记录时直接返回数据

    if (districts.length == 1) return districts[0]

    // 根据权重挑选,返回数据
    let pickid = pickup(picks, districts)
    let district = _.find(districts, x => x.id == pickid)

    return district
}

msdz.prototype.set = function (district) {

    if (district && district.hasOwnProperty("id"))
        add.push(district)
};

msdz.prototype.mset = function (districts) {

    if (!_.isArray(districts) || districts.length < 1) return []

    for (let i in districts) {
        if (district[i] && district[i].hasOwnProperty("id"))
            add.push(district)
        else {
            log("data [id] is missed.")
            log(districts[i])
        }
    }

};


msdz.prototype.get = function (id) {

    return _.find(dzs, x => x.id == id)
};

msdz.prototype.mget = function (ids) {

    if (!_.isArray(ids) || ids.length < 1) return []
    return _.filter(dzs, x => ids.indexOf(x.id) >= 0)
};


msdz.prototype.dict = function () {
    return false

    let keys = {}
    for (let i in dzs) {

        let name = dzs[i].name
        let kw = keyword(name)

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


    fs.write("./res/district.utf8", dicts.join("\n"))
    log(`[./res/district.utf8] dict is builded`)
    loaddic()
}



module.exports = msdz;

(async () => {
    let a = new msdz()

    await a.load(true)

    let address = require("../cache/address.json")
    let now = new Date()
    for (let i in address) {
        let res = a.match(address[i])
        if (i != 0 && i % 10000 == 0) {
            let last = new Date()
            console.log(`no.${i} : Average use ${((last - now) / 10000).toFixed(2)}ms current txt is ${address[i]}`)
            now = last
            misc.log(res)
        }
    }
    // a.save()
})()

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