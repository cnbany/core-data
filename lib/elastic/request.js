const qs = require("qs");
const log = require("debug")("bany-elastic:request")
const Got = require("got");



const elasticOpt = require('config').get('server.elastic');
const elasticUrl = `http://${elasticOpt.user}:${elasticOpt.pass}@${elasticOpt.socket}`


const got = Got.extend({
    baseUrl: elasticUrl,
    json: true,
    headers: {
        "Content-Type": "application/json"
    }
});


const request = {

    search: async function (index, qs) {

        if (!qs) return null
        log(qs);
        log("search: is begin")
        let url = `/${index}/_search?scroll=30m`
        let opt = {
            body: qs
        }

        const {
            body
        } = await got.post(url, opt);

        log("search: is success done!")
        return body


    },

    scroll: async function (scroll_id) {
        log("scroll: search is begin")

        if (!scroll_id) return -1

        let url = "/_search/scroll?" +
            qs.stringify({
                scroll: "30m",
                scroll_id: scroll_id
            });

        try {
            const {
                body
            } = await got(url);
            log("scroll: search is success done!")
            return body
        } catch (err) {
            log("scroll: search is error !", err)
            return
        }
    },

    upsert: async function (index, id, ob) {

        log("upsert is begin")

        let qs = {
            doc: ob,
            doc_as_upsert: true
        };

        let {
            body
        } = await got.post(`/${index}/_doc/${id}/_update`, {
            body: qs
        });
        log("upsert is success done !")
        return body
    },


    bulk: async function (index, obs, key = "id") {

        if (Array.isArray(obs) || obs.length == 0) return []
        log("bulk: is begin")
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

        let url = `/${index}/_doc/_bulk`
        let ops = {
            json: false,
            body: qs
        }
        let {
            body
        } = await got.post(url, ops);

        log("bulk: is success done!")
        return body;
    },


    refresh: async function (index) {

        let url = `/${index}/_refresh`
        let ret = await got.post(url);
        return ret
    },

    count: async function (index) {
        let res = await got.get(`/${index}/_count`);
        if (res.body)
            return res.body.count
        else -1
    }
}

module.exports = request