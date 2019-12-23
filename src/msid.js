require('dotenv').config({ DEBUG: 'bany*' })
console.log(process.env.DEBUG)
const gen = require('nanoid/non-secure/generate')
const log = require("debug")("bany-msid:")

const _ = require("lodash");

const redis = require('../lib/redis')("scenics");
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

async function _sync() {

    let qs = {
        "query": {
            "match_all": {}
        },
        size: 5000,
        _source: ["id", "external"]
    }

    let res = await db.search(qs)

    res = _.reduce(res, function (result, item) {
        if (item.external && item.external.amap) {
            let o = {}
            o[item.external.amap.id] = item.id
            result.push(o)
        }
        return result;
    }, [])

    await redis.set(res)
};


function msid(name, len) {

    name = name || "scenic"
    len = len || 12

    let res = {
        get: async function (key) {
            let ret = await redis.get(key)
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


async function _synctest() {

    let qs = {
        "query": {
            "match_all": {}
        },
        size: 5000
    }

    let res = await db.search(qs)

    res = _.reduce(res, function (result, item) {
            let o = {}
            o[item.id] = JSON.stringify(item)
            result.push(o)
        return result;
    }, [])

    await redis.set(res)
};


(async () => {
    _synctest()
})()