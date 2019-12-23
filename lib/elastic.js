// require("array.prototype.flatmap").shim();
// const dsl = require("bodybuilder");
/* 
API Referenceedit
https://bodybuilder.js.org/docs/
https://bodybuilder.js.org/
 */

const _ = require("lodash");
const log = require("debug")("elastic:")


const fs = require("./fs");
const _parse = require("./elastic/parse")
const _request = require("./elastic/request")


const EventEmitter = require('events').EventEmitter


class es extends EventEmitter {
    constructor(index = "index", key = "id") {
        super()
        this.index = index;
        this.key = key;
        this.scroll_id = "";
        this.search_count = 0;
    }
}

es.prototype.search = async function (qs) {

    if (!qs) return null
    log(qs);

    let res = []

    let body = await _request.search(this.index, qs)

    this.search_count = body.hits.total.value;
    this.scroll_id = body._scroll_id;

    let ss = _parse.search(body);
    this.emit("data", ss)
    res.push(...ss)

    while (Array.isArray(ss) && ss.length > 0 && res.length < this.search_count) {

        body = await _request.scroll(this.scroll_id)

        if (body) {
            ss = _parse.search(body)
            this.emit("data", res)
            res.push(...ss)
        } else ss = []
    }

    this.emit("searchdone")
    return res
};

es.prototype.upsert = async function (id, ob) {

    let body = await _request.upsert(this.index, id, ob)

    if (body._shards.successful)
        log(`DB ["${body._index}"] ID ["${body._id}"] ${body.result} success!`)
    else
        log(`DB ["${body._index}"] ID ["${body._id}"] ${body.result} failed!`)

    this.emit("postdone")

};

es.prototype.crwdone = async function (id, cls) {
    let crw = {
        "cls": new Date().valueOf()
    }

    await _request.upsert(this.index, id, {
        crw
    })
}

es.prototype.bulk = async function (obs, key = "id") {

    let obsChunk = _.chunk(obs, 1000);
    for (let i in obsChunk) {

        let body = await _request.bulk(this.index, obsChunk[i], key)
        // result process
        // let ret = _parse.bulk(body)
        log(i * 1000 + obsChunk[i].length)
    }
    await _request.refresh(this.index)
    this.emit("postdone")
}


es.prototype.count = async function () {
    return await _request.count(this.index)
}

es.prototype.import = function (file, idkey) {

    if (!file || !fs.exist(file)) return false

    let that = this,
        datas = []

    lineFn = (line) => {
        datas.push(JSON.parse(line))
    }

    doneFn = async () => {
        await that.bulk(datas, idkey)
    }

    fs.readline(file, lineFn, doneFn)
}

es.prototype.dump = async function (qs) {
    qs = qs || {
        "query": {
            "match_all": {}
        },
        size: 5000
    }
    let res = await this.search(qs)
    return res
}

module.exports = es;

// (async () => {
//     let db = new es("mfw_index")
//     let res = await db.dump()
//     log(res.length)
//     log(1)

// })()
// async function count() {

//     const { body } = await custom('/_cat/indices')

//     console.log(JSON.stringify(body, null, 2));
// };
// async function search() {

//     let qs = dsl()
//         .notFilter("match", "flag", "done")
//         .size(100)
//         .build();

//     console.log(JSON.stringify(qs));

//     const { body } = await custom.post("/_search", {
//         scroll: "10m",
//         _source: ["id", "table"],
//         body: qs
//     });
//     return _parseSearch(body, false);

// }
// count()

// search()

// let e = new es("bbbbbbbbbb");
// e.count

// e.upsert(b[0].poi, b[0])
// e.count

// e.bulk(b, "poi")

// (async () => {
//     let e = new es("mfw_poi");

//     let ids = ["16", "54", "63", "86", "177", "181", "204"];

//     // let resget = await e.get(ids);

//     // console.log(JSON.stringify(resget, null, 2));

//     let qs = {
//         query: {
//             bool: {
//                 must: [
//                     {
//                         match_all: {}
//                     }
//                 ],
//                 must_not: [],
//                 should: []
//             }
//         }
//     };

// let ressearch = await e.search(qs, null);

// console.log(JSON.stringify(ressearch, null, 2));

// let resscroll = await e.scroll();
// console.log(JSON.stringify(resscroll, null, 2));

//     let b = [
//         {
//             poi: "16",
//             mddid: "215366666",
//             name: "龙门石窟",
//             name1: "龙门石窟"
//         },
//         {
//             poi: "54",
//             mddid: "64160",
//             img:
//                 "https://n4-q.mafengwo.net/s14/M00/54/C3/wKgE2l0mzzqAQN_xACZAqCHrjlI675.jpg",
//             name: "茱萸峰景区"
//         },
//         {
//             poi: "63",
//             mddid: "64160",
//             img:
//                 "https://b1-q.mafengwo.net/s12/M00/24/80/wKgED1umQ_KAaB21AFub4temIrk91.jpeg",
//             name: "云台山"
//         },
//         {
//             poi: "86",
//             mddid: "14575",
//             img:
//                 "https://b4-q.mafengwo.net/s9/M00/A5/E5/wKgBs1hBekiAEIhcAAoOwsR5OpA95.jpeg",
//             name: "绍兴鲁迅故里景区"
//         },
//         {
//             poi: "177",
//             mddid: "14575",
//             img:
//                 "https://b3-q.mafengwo.net/s12/M00/AE/FF/wKgED1uoJ2SACJKVAA3xUawypU023.jpeg",
//             name: "三潭印月"
//         },
//         {
//             poi: "181",
//             mddid: "14575",
//             img:
//                 "https://n1-q.mafengwo.net/s5/M00/E2/03/wKgB3FGYta-APXYeABGQpQCYsdY78.jpeg",
//             name: "灵隐寺"
//         },
//         {
//             poi: "204",
//             mddid: "12967",
//             img:
//                 "https://b2-q.mafengwo.net/s13/M00/13/FE/wKgEaVzznoeALVqpABQ0yXc23Ys12.jpeg",
//             name: "洛阳周王城天子驾六博物馆"
//         }
//     ];
//     // e.upsert(b[0].poi, b[0]);
//     e.bulk(b, "poi");
// })();

// e.getIds()
//     .then(x => {
//         console.log(JSON.stringify(x));
//         e.scroll()
//             .then(x => {
//                 console.log(JSON.stringify(x));
//             })
//             .catch(err => {
//                 console.log(err);
//             });
//     })
//     .catch(err => {
//         console.log(err);
//     });

// let id = "DnF1ZXJ5VGhlbkZldGNoAgAAAAAAAAHrFm1UWmt6aFltUjNPU3hEWnJRUkszSVEAAAAAAAAB7BZtVFpremhZbVIzT1N4RFpyUVJLM0lR"

// scroll(id)
//     .then(x => {
//         console.log(JSON.stringify(x))
//     }).catch(err => {
//         console.log(err)
//     })