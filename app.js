process.env.DEBUG = "bany-scenic*"
const _ = require("lodash"),
    fs = require("@cnbany/fs"),
    log = require("debug")("bany-scenic:"),
    parse = require("./src/bany/parse")


let scenics = [],
    ids = [],
    classifys = [],
    qualifys = [],
    specials = [],
    peoples = [],
    tours = [],
    count = 0

let lineFn = (line) => {
    let li = JSON.parse(line)
    ids.push(li.id)
    let name = li.name.replace(/\(.*\)/g, "")

    let classify = (li.classify) ? parse.classify(li.classify) : ""
    classifys.push(classify)
    if (li.scenic) {
        let spec = (li.scenic.special) ? parse.special(li.scenic.special) : {}
        if (spec.specials) {
            li.scenic.special = spec.specials
            specials.push(...li.scenic.special)
        }
        if (spec.tours && spec.tours.length > 0) {
            li.scenic.tour = spec.tours
            tours.push(...li.scenic.tour)
        }

        li.scenic.qualify = (li.scenic.qualify) ? parse.qualify(li.scenic.qualify) : []
        qualifys.push(...li.scenic.qualify)

        li.scenic.peoples = (li.scenic.peoples) ? parse.people(li.scenic.peoples) : []
        peoples.push(...li.scenic.peoples)
    }

    let star = (li.scenic && li.scenic.star) ? li.scenic.star : 0,


    let o = {
        id: li.id,
        name,
        classify,
        parent: li.aois || [],
        cls: li.cls,
        star,
        score: li.comment.score || 0,
        show: 20,
        scenic: li.scenic || {},
        cover: li.cover || "",
        onmap: li.onmap || undefined
    }
    // if (!(o.cls == "noop" && o.score < 2.5))
    if (o.cls == "aoi" && o.onmap && (o.parent.length == 0 || o.parent.indexOf(o.id) >= 0)) {
        o.parent = []
        scenics.push(o)
        o.scenic && o.scenic.star == 0 && delete o.scenic.star
    }

    // if (!o.onmap)
    //     log(o)
    if (count++ % 10000 == 0)
        log(count, li.name)
}

function output(name, items) {
    items = _.compact(_.uniq(items))
    fs.write(name + ".txt", items.join("\n"))
    log(count, `file [${name}.txt] save done`)
}

let doneFn = () => {

    // output("ids", ids)
    // output("tours", tours)
    // output("qualifys", qualifys)
    // output("specials", specials)
    // output("peoples", peoples)

    scenics = _.orderBy(scenics,['star','score'],['desc','desc'])
    fs.write("scenics-all.ndjson", scenics)
    log(count, "file [scenics-all.ndjson] save done")
}

fs.readline("./cache/scenic.all.ndjson", lineFn, doneFn)