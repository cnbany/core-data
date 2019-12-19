const fs = require('../../libs/fs');


const misc = require('../../libs/misc');


// const idms = new Idms("scenics", 12)


const log = misc.log

function group(file = "./cache/scenics.ndjson") {
    let result = {}
    let scenics = fs.read(file)
    for (let i in scenics) {
        if (i != 0 && i % 10000 == 0)
            log(`${i} : ${scenics[i].name}`)

        let key = (scenics[i].districts && scenics[i].districts.province) ? scenics[i].districts.province.adcode : "000000"

        if (!result.hasOwnProperty(key)) result[key] = []

        result[key].push(scenics[i])
    }


    for (let key in result) {
        // console.log(result[key].length)
        let fp = `./cache/bany/${key}.ndjson`
        log(`[${fs.basename(fp)}]`)
        fs.write(fp, result[key])
    }
};

group()