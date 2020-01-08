const _ = require("lodash"),
    fs = require("@cnbany/fs"),
    log = require("debug")("bany-parse:")


function people(items) {
    for (let i in items) {
        items[i] = items[i].split(/ /)
    }
    return _.flattenDeep(items)
}

function qualify(items) {
    for (let i in items) {
        items[i] = items[i].split(/ /)
    }
    return _.flattenDeep(items)
}

function special(items) {

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

    let specials = [],
        tours = [],
        reto = /旅*游$/,
        rech = /[\u4e00-\u9fa5]/

    for (let i in items) {
        if (reto.test(items[i])) tours.push(items[i])
        else if (rech.test(items[i])) specials.push(items[i])
    }

    return {
        specials,
        tours
    }
}



function classify(str) {
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

module.exports = {
    classify,
    special,
    qualify,
    people
}