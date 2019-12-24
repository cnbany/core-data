process.env.DEBUG = "bany-*"

const gen = require('nanoid/non-secure/generate')
const log = require("debug")("bany-msid:")

const _ = require("lodash");

const redis = require('../lib/redis')("ids");
const elastic = require("../lib/elastic")
const db = new elastic("scenics")

// let ids = {},
//     add = {}
/*  ids => load data ; add => add data */


/* 
manage data

flush : 刷新数据  elastic(src) => redis => file => redis 

load : 加载  file || redis => mem 
done : 加载  mem => file && redis 

get :   amap key => id
set :   add amap key, id  => mem

 */
// process.env.DEBUG = 
function msid(name, len) {

    name = name || "scenic"
    len = len || 12

    let res = {
        get: async function (key) {
            let ret = await redis.get(key)
            if (!ret) {
                ret = gen('1234567890abcdef', len)
                let o = {}
                o[key] = ret
                await redis.set(o)
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

(async ()=>{
    _sync()
})()
