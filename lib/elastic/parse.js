// https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html

const _ = require("lodash")

module.exports = {
    search: (body) => {

        let res = "_source";
        if (body.hits && body.hits.hits)
            return _.flatMap(body.hits.hits, doc => doc[res])
        return;
    },

    bulk: (body) => {
        body = JSON.parse(body)

        const res = {
            took: body.took,
            success: 0,
            errors: 0
        };

        body.items.forEach((action, i) => {

            let opt = Object.keys(action)[0],
                key = action[opt].result

            if (!res.hasOwnProperty(key))
                res[key] = []
            res[key].push(action[opt]._id)

            res.success += 1
        });

        return res;
    }
}