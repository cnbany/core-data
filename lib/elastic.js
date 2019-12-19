require("array.prototype.flatmap").shim();
const _ = require("lodash");
const qs = require("qs");
const dsl = require("bodybuilder");

const elasticOpt = require('config').get('server.elastic');
const elasticUrl = `http://${elasticOpt.user}:${elasticOpt.pass}@${elasticOpt.socket}`
/* 
API Referenceedit
https://bodybuilder.js.org/docs/
https://bodybuilder.js.org/
 */
const Got = require("got");
const EventEmitter = require('events').EventEmitter

const got = Got.extend({
    baseUrl: elasticUrl,
    json: true,
    headers: {
        "Content-Type": "application/json"
    }
});


// https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html

function _parseSearch(resbody) {
    let key = "_source";

    if (resbody.hits && resbody.hits.hits)
        ret = resbody.hits.hits.flatMap(doc => {
            // doc[key]["_id"] = doc["_id"]
            return doc[key]
        });
    // console.log(JSON.stringify(resbody, null, 2));

    return ret;
}

function _parsebulk(res) {
    res = JSON.parse(res)
    const doc = {
        took: res.took,
        success: 0,
        errors: 0
    };

    // The items array has the same order of the dataset we just indexed.
    // The presence of the `error` key indicates that the operation
    // that we did for the document has failed.
    res.items.forEach((action, i) => {
        let opera = Object.keys(action)[0];
        let reskey = action[opera].result
        if (!doc.hasOwnProperty(reskey)) doc[reskey] = []
        doc[reskey].push(action[opera]._id)
        doc.success += 1
    });

    return doc;
}




class es extends EventEmitter {
    constructor(index = "index", key = "id") {
        super()
        this.index = index;
        this.key = key;
        this.scroll_id = "";
        this.search_count = 0;
    }
}


es.prototype.search = async function (qs, scroll = false) {

    if (!qs) return null
    console.log(JSON.stringify(qs));
    let url = (scroll) ? `/${this.index}/_search?scroll=30m` : `/${this.index}/_search`
    let opt = {
        body: qs
    }

    const {
        body
    } = await got.post(url, opt);
    let res = _parseSearch(body, false);
    this.search_count = body.hits.total.value;
    this.scroll_id = body._scroll_id || null
    this.emit("data", res)
    return res

};

es.prototype.scroll = async function (scroll_id = this.scroll_id) {
    console.log("start scroll search")
    if (!scroll_id) return -1

    try {

        let url = "/_search/scroll?" +
            qs.stringify({
                scroll: "30m",
                scroll_id: scroll_id
            });

        const {
            body
        } = await got(url);
        let res = _parseSearch(body, false);
        if (res.length)
            this.emit("data", res)
        else if(res.length == 0 )
            this.emit("searchdone")

        return res.length

    } catch (err) {
        // console.log(JSON.stringify(err))
        return -1
    }

};

es.prototype.upsert = async function (id, ob) {
    let qs = {
        doc: ob,
        doc_as_upsert: true
    };

    let {
        body
    } = await got.post(`/${this.index}/_doc/${id}/_update`, {
        body: qs
    });

    // body = JSON.parse(body)
    if (body._shards.successful)
        console.log(`DB ["${body._index}"] ID ["${body._id}"] ${body.result} success!`)
    else
        console.error(`DB ["${body._index}"] ID ["${body._id}"] ${body.result} failed!`)

    this.emit("postdone")

};

es.prototype.crwdone = async function (id, cls) {
    let crw = {}
    crw[cls] = new Date().valueOf()
    this.upsert(id, {
        crw
    })
}

es.prototype._bulk = async function (obs, key = "id") {
    if (!_.isArray(obs) || obs.length == 0)
        return []
    // throw {
    //     code: -1,
    //     message: "bulk content is null"
    // };
    // console.log(JSON.stringify(obs, null, 2));

    // object ==> bulk body ndjson 
    let qs = ""
    for (let i in obs) {
        if (obs[i].hasOwnProperty(key)) {
            qs += `{"update": {"_id": "${obs[i][key].trim()}"}}\n`
            qs += JSON.stringify({
                doc: obs[i],
                doc_as_upsert: true
            }) + "\n"
        }
    }

    // http got 

    let url = `/${this.index}/_doc/_bulk`
    let ops = {
        json: false,
        body: qs
    }
    let {
        body
    } = await got.post(url, ops);

    // result process


    let ret = _parsebulk(body)

    console.log(JSON.stringify(ret));
    return ret;
};


es.prototype.bulk = async function (obs, key = "id") {

    let obsChunk = _.chunk(obs, 1000);
    for (let i in obsChunk) {
        await this._bulk(obsChunk[i], key)
        // console.log(i * 1000 + obsChunk[i].length)
    }
    await this.refresh()
    this.emit("postdone")
}

es.prototype.refresh = async function () {

    let url = `/${this.index}/_refresh`
    let ret = await got.post(url);
    return ret

}


es.prototype.count = async function () {
    try {
        let res = await got.get(`/${this.index}/_count`);
        return (res.body) ? res.body.count : -1
    } catch (err) {
        return -1
    }
}

module.exports = es;

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