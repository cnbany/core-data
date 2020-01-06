const _ = require("loadsh")
const log = require("debug")("bany-test:")

process.env.DEBUG= "bany*"

let a = {
    classify: '风景名胜;公园广场;公园',
    external: {
        amap: {
            src: 'https://www.amap.com/detail/B001557L8V',
            id: 'B001557L8V'
        }
    },
    address: '上海市浦东新区世纪塘路',
    adcode: '310115',
    name: 'name_a',
    alias: ['name_a'],
    aoi: ['173d119dfdf4'],
    comment: {
        score: 4.2
    },
    id: '173d119dfdf4',
    scenic: {
        peoples: [],
        star: 0
    }
}

let b = {
    name: 'name_b',
    district: '310115',
    class: 'scenic',
    alias: ['name_b'],
    scenic: {
        star: 0,
        qualify: [],
        special: ['休闲', '观光', '看海', '散步', '健身', '公园', '雕塑', '海滨']
    },
    comment: {
        want: 10,
        go: 52
    },
    external: {
        meet99: {
            id: 'nanhuizui',
            name: '上海南汇嘴观海公园',
            src: 'https://www.meet99.com/jingdian-nanhuizui.html'
        }
    }
}

let o = {}
_.merge(o,a, b)

 log(o)


 