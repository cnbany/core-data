/*
on(start)
 on(next)
    ->search()
        -> on("get") 
            -> crawler()
                -> on("set") 
                    -> update()/upsert() 
                        -> on("next")

*/

const EventEmitter = require('events').EventEmitter
const Crawler = require("crawler");
const Elastic = require("../libs/elastic");

const misc = require("../libs/misc");
const _ = require("lodash");
const shell = require('../libs/adb');
const onFailed = require("../libs/failed");
const log = misc.log

let bnext = true
let crawled = []


async function done(crawl) {
    log("begin next !!!!!!!!!!!!!")
    // await shell.ipflush()
    let ret = await crawl.db.scroll()
    if (ret <= 0 && bnext) {
        log("next search is begin!");
        crawl.emit("next", crawl)
        bnext = false
    }
}

class Crawl extends EventEmitter {
    constructor(db = "index") {
        super()

        // if (!(this instanceof Crawl)) {
        //     return new Crawl();
        // }
        this.db = new Elastic(db);

        this.ce = new Crawler({
            maxConnections: 10,
            rateLimit: 100,
            jQuery: false,
            headers: {
                "content-type": "application/json",
                "User-Agent": misc.agent("pc")
            },
            callback: (error, res, done) => {
                log(`crawL page url: ${res.options.url} is done!`);
                if (error) throw error;
                if (!_.startsWith(res.statusCode, "2"))
                    throw {
                        message: res.statusMessage,
                        code: res.statusCode
                    };
                this.emit("set", res)
                done();
            }
        });


        //event transfrom

        this.db.on("data", (res) => {
            for (let i in res)
                this.emit("get", res[i])
        });

        this.db.on("postdone", () => {
            if (this.ce.queueSize == 0) done(this)
        });

    }
}



Crawl.prototype.search = function (qs) {

    this.db.search(qs, true)
}

Crawl.prototype.crawler = function (opt) {

    this.ce.queue(opt)
}

Crawl.prototype.update = function (result, flag) {

    if (!_.isArray(result) || result.length == 0) return
    this.db.bulk(result)
        .then(() => {
            bnext = true

            if (flag && result[0].frm && result[0].frm.id) {
                this.db.crwdone(result[0].frm.id, flag)
            }
        })
        .catch(onFailed);
};

Crawl.prototype.upsert = function (result, mode = "done") {

    if (JSON.stringify(result) === "{}") return
    this.db.upsert(result.id, result)
        .then(() => {
            bnext = true
            if (result.frm.id) {
                this.db.crwdone(result.frm.id, mode)
            }
        })
        .catch(onFailed);
};

Crawl.prototype.run = async function () {
    let count = await this.db.count()
    if (count > 0) {
        this.emit("next")
    } else {
        this.emit("start")
    }
}

module.exports = Crawl




/*
const Crawl = require('../libs/crawl')
const dsl = require("bodybuilder");
const _ = require("lodash");

//抓取数据的处理器
function parse(res) {

    let url = res.options.url;
    let id = _.last(url.split("/"));
    console.log(`Mdd [${id}] page url: ${url}`);

    let obs = JSON.parse(res.body)

    if (!_.isArray(obs) || obs.length == 0)
        return []

    let ret = [];
    let re = /<a href.*lvyou-(.*)\.html.*>(.*)（(.*)）<\/a>/;


    for (let i in obs) {
        if (obs[i] && obs[i].text && re.test(obs[i].text)) {
            let res = obs[i].text.match(re);
            ret.push({
                id: res[1],
                cls: "mdd",
                txt: {
                    id: res[1],
                    parent: id,
                    name: res[2],
                    sub: res[3],
                    child: obs[i].hasChildren ? true : false
                },

                // !!! 重要，通过frm.id标识任务完成，否则会重复抓取。
                frm: {
                    id: id,
                    url: url
                }
                // crw:{                },
            });
        }
    }
    //格式化数据提交数据库
    this.update(ret, "mdd")
};



// 初始请求地址
function start() {
    let opt = {
        url: `https://www.meet99.com/maps/loadchild/lvyou/`,
        referer: `https://www.meet99.com`
    }
    this.crawler(opt)
};

//从数据库中读取数据后，构建地址，抓取数据
function crawl(objs) {
    for (let i in objs) {
        let id = objs[i].id
        let opt = {
            url: `https://www.meet99.com/maps/loadchild/lvyou/${id ? id : ""}`,
            referer: `https://www.meet99.com`
        }
        this.crawler(opt)
    }
};

//从数据库读取任务数据
function next() {

    let qs = dsl()
        .filter("match", "cls", "mdd")
        .notFilter("range", "crw.mdd", {
            gt: new Date().valueOf() - 864000000
        })
        .size(15)
        .build();
    qs._source = ["id"]

    this.search(qs)
}

let mdd = new Crawl("meet1");
mdd.on("start", start)
mdd.on("get", crawl)
mdd.on("set", parse)
mdd.on("next", next)
mdd.run()

 */