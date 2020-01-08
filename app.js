process.env.DEBUG = "bany-scenic*"
const _ = require("lodash"),
    fs = require("@cnbany/fs"),
    log = require("debug")("bany-scenic:")


function pPeoples(items) {
    for (let i in items) {
        items[i] = items[i].split(/ /)
    }
    return _.flattenDeep(items)
}

function pQualifys(items) {
    for (let i in items) {
        items[i] = items[i].split(/ /)
    }
    return _.flattenDeep(items)
}

function pSpecials(items) {

    for (let i in items) {
        items[i] = items[i].replace(/[“”]/g, "")
            .replace(/等.*$/, "")
            .replace("这五座寺庙都有不少脍炙人口的传说故事", "传说故事")
            .replace("并留存有丰富的雕刻", "雕刻")
            .replace("各种水上娱乐活动", "水上娱乐活动")
            .replace("游客在景区内乘索道", "索道")
            .replace("观赏", "")
            .replace("看海景", "海景")
            .replace(/观?看([^书海戏])/, "$1")


        items[i] = items[i].split(/ |。|和/)
    }
    items = _.flattenDeep(items)

    let special = [],
        tour = [],
        reto = /旅*游$/,
        rech = /[\u4e00-\u9fa5]/

    for (let i in items) {
        if (reto.test(items[i])) tours.push(items[i])
        else if (rech.test(items[i])) special.push(items[i])
    }

    return {
        special,
        tour
    }
}



function pClassify(str) {
    let list = [
            "风景名胜",
            "自然地名",
            "交通地名",
            "休闲场所",
            "博物馆",
            "展览馆",
            "科技馆",
            "图书馆",
            "运动场馆",
            "高等院校",
            "农林牧渔基地",
            "特色商业街",
            "展会展览"
        ],
        re = new RegExp(`(${list.join("|")})`)

    if (re.test(str))
        str = str.replace(/.*;/g, '')
        .replace('风景名胜风景名胜', '')
        .replace('风景名胜公园广场', '')
        .replace('体育休闲服务休闲场所', '')
        .replace('体育休闲服务运动场馆', '')
        .replace('科教文化服务学校', '')
        .replace('地名地址信息自然地名', '')
        .replace('地名地址信息交通地名', '')
        .replace('科教文化服务博物馆', '')
        .replace('科教文化服务展览馆', '')
        .replace('相关旅游景点', '景点')
        .replace('其它农林牧渔基地', '景点')
        .replace('公园内部设施', '内部设施')
        .replace(/名$/, '')
    else
        str = "景点"

    return str
}


let scenics = [],
    ids = [],
    classifys = [],
    qualifys = [],
    specials = [],
    peoples = [],
    tours = [],
    count = 0
let lineFn = (line) => {
    let li = JSON.parse(line)
    ids.push(li.id)
    let name = li.name.replace(/\(.*\)/g, "")

    let classify = (li.classify) ? pClassify(li.classify) : ""
    classifys.push(classify)

    if (li.scenic) {
        let spec = (li.scenic.special) ? pSpecials(li.scenic.special) : {}
        if (spec.special) {
            li.scenic.special = spec.special
            specials.push(...li.scenic.special)
        }
        if (spec.tour && spec.tour.length > 0) {
            li.scenic.tour = spec.tour
            tours.push(...li.scenic.tour)
        }

        li.scenic.qualify = (li.scenic.qualify) ? pQualifys(li.scenic.qualify) : []
        qualifys.push(...li.scenic.qualify)

        li.scenic.peoples = (li.scenic.peoples) ? pPeoples(li.scenic.peoples) : []
        peoples.push(...li.scenic.peoples)
    }


    let o = {
        id: li.id,
        name,
        classify,
        parent: li.aois || [],
        cls: li.cls,
        scenic: li.scenic || {},
        score: li.comment.score || 0,
        cover: li.cover || "",
        onmap: li.onmap || undefined
    }
    // if (!(o.cls == "noop" && o.score < 2.5))
    if (o.cls == "aoi" && o.onmap)
        scenics.push(o)
    // if (!o.onmap)
    //     log(o)
    if (count++ % 10000 == 0)
        log(count, li.name)

}

let doneFn = () => {
    fs.write("ids.txt", ids.join("\n"))
    log(count, "file [ids.txt] save done")

    classifys = _.compact(_.uniq(classifys))
    fs.write("classifys.txt", classifys.join("\n"))
    log(count, "file [classifys.txt] save done")

    tours = _.compact(_.uniq(tours))
    fs.write("tours.txt", tours.join("\n"))
    log(count, "file [tours.txt] save done")

    qualifys = _.compact(_.uniq(qualifys))
    fs.write("qualifys.txt", qualifys.join("\n"))
    log(count, "file [qualifys.txt] save done")

    specials = _.compact(_.uniq(specials))
    fs.write("specials.txt", specials.join("\n"))
    log(count, "file [specials.txt] save done")

    peoples = _.uniq(peoples)
    fs.write("peoples.txt", peoples.join("\n"))
    log(count, "file [peoples.txt] save done")
    fs.write("scenics.ndjson", scenics)
    log(count, "file [scenics.ndjson] save done")
}

fs.readline("scenic.all.ndjson", lineFn, doneFn)