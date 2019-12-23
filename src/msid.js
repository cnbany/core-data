const gen = require('nanoid/non-secure/generate')
const _ = require("lodash");

const fs = require('../lib/fs');
const redis = require('../lib/redis')("scenic");
let log = require("debug")("bany-msid:")

let db = new elastic("scenics")

let ids = {},
    add = {}
/*  ids => load data ; add => add data */


/* 
manage data

flush : 刷新数据  elastic(src) => redis => file => redis 

load : 加载  file || redis => mem 
done : 加载  mem => file && redis 

get :   amap key => id
set :   add amap key, id  => mem

 */

function _load(auto = true) {


    // auto 模式: 一天更新一次
    let bsync = false
    let qs = qs || {
        "query": {
            "match_all": {}
        },
        size: 5000        
    }
    let res = db.dump()
    };


function msid(name, len) {

    name = name || "scenic"
    len = len || 12

    let res = {
        get: function (key) {
            let ret = ids[key] || add[key] || null
            if (!ret) {
                ret = gen('1234567890abcdef', len)
                await redis.set({
                    key: ret
                })
            }
            return ret
        },
        set: async function (key, value) {
            await redis.set(key, value)
        }
    }
    return res
}

module.exports = msid;