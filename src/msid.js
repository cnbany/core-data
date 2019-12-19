const gen = require('nanoid/non-secure/generate')
const _ = require("lodash");

const fs = require('../libs/fs');
const misc = require('../libs/misc');
const redis = require('../libs/redis');

let log = misc.log

let ids = {},
    add = {}
/*  ids => load data ; add => add data */


/* 
manage data

flush : 刷新数据  elastic(src) => mem => file => redis 

load : 加载  file || redis => mem 
done : 加载  mem => file && redis 

get :   amap key => id
set :   add amap key, id  => mem

 */


function msid(name = "scenic", len = 12, path = "./cache/ids.json") {
    this.name = name
    this.len = len
    this.path = path
}

msid.prototype.get = function (key) {
    let ret = ids[key] || add[key] || null
    if (!ret) {
        ret = gen('1234567890abcdef', this.len)
        add[key] = ret
    }
    return ret
};

msid.prototype.set = function (key, value) {
    add[key] = value
};

msid.prototype.load = async function (auto = true) {

    // auto 模式: 一天更新一次
    let bsync = false
    if (!fs.exist(this.path))
        bsync = true
    else if (!auto)
        bsync = false
    else {
        let now = new Date()
        let mtime = fs.info(this.path).mtime
        if (now.getDate() - mtime.getDate() >= 1)
            bsync = true
    }

    if (bsync) {
        ids = await redis.get()
    } else
        ids = fs.read(this.path, 'json')
};


msid.prototype.save = async function () {

    // mem => file
    fs.write(this.path, _.assign(ids, add), 'json')

    //mem => redis
    if (JSON.stringify(add) !== '{}')
        await redis.set(add)
    else
        log('no new data.')
};

module.exports = msid;

// (async () => {
//     let m = {
//         "B020202D9F": "a0b5a5bbad7c",
//         "B0175013T1": "9a0b53cf5624"
//     }
//     let idms = new msid("scenic")
//     await idms.load()
//     idms.set("1111111111111", "tttttttttttttt")
//     let i = idms.get("B020202D9F")
//     console.log(i)
//     await idms.done()
//     console.log(i)
// })();