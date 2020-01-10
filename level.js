process.env.DEBUG = "bany-scenic*"
const _ = require("lodash"),
    fs = require("@cnbany/fs"),
    log = require("debug")("bany-scenic:"),
    parse = require("./src/bany/parse")
earth = require("./lib/earth")

let scenics = fs.read("./scenics-all.ndjson"),
    dest = []

scenics = _.orderBy(scenics, ['star', 'score'], ['desc', 'desc'])

for (let i in earth.SCALE) {
    if (i < 3) continue
    log("start:", i)
    count = 0
    for (let j in scenics) {
        if (scenics[j].show < 20) continue
        if (scenics[j].star < 3 && i < 10) continue


        let bflag = true
        if (dest.length > 0)
            for (let k in dest) {
                if (count++ % 3000000 == 0) log(count)
                if (earth.distance(scenics[j].onmap.point, dest[k].onmap.point) < earth.SCALE[i] / 2) {
                    bflag = false
                    continue
                }
            }

        if (bflag) {
            scenics[j].show = _.toNumber(i) + 1
            dest.push(scenics[j])
        }
    }
    log(dest.length)
    log("end :", i)
    fs.write(`scenic.${i}.ndjson`, dest)
}

log(1)