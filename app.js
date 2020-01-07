process.env.DEBUG = "bany-scenic*"
const _ = require("lodash"),
    fs = require("@cnbany/fs"),
    log = require("debug")("bany-scenic:")
let scenics = [],
    count = 0
let lineFn = (line) => {
    let li = JSON.parse(line)
    let name = li.name.replace(/\(.*\)/g, "")
    let classify = (li.classify) ? li.classify.replace(/.*;/g, '') : ""
    let o = {
        id: li.id,
        name,
        classify,
        parent: li.aois || [],
        cls: li.cls,
        scenic: li.scenic || {},
        score: li.comment.score || 0,
        cover: li.cover || "",
        onmap: li.onmap || undefined
    }
    // if (!(o.cls == "noop" && o.score < 2.5))
    if (o.cls == "aoi" && o.onmap)
        scenics.push(o)
    // if (!o.onmap)
    //     log(o)
    if (count++ % 10000 == 0)
        log(count, li.name)

}

let doneFn = () => {
    fs.write("scenics.ndjson", scenics)
    log(count, "file [scenics.ndjson] save done")
}

fs.readline("scenic.all.ndjson", lineFn, doneFn)