const fs = require('graceful-fs');
const rl = require('readline')
const md = require('make-dir');

const path = require('path');
const glob = require("globby");



function read(file, format, code = 'utf-8') {

    if (!file || !fs.existsSync(file)) return false

    format = (['txt', 'json', 'ndjson'].indexOf(format) >= 0) ? format : path.extname(file).replace(".", '')

    let data = fs.readFileSync(file, code)

    switch (format) {
        case "ndjson":
            let out = []

            String(data)
                .split(/\r?\n/)
                .forEach(line => {
                    if (line.trim() !== '') {
                        out.push(JSON.parse(line));
                    }
                });
            return out;

        case "json":
            return JSON.parse(data)

        case "txt":
            return data
    }
}

function write(file, data, mode, format) {

    if (!file || !data) return false

    if (mode) {
        if (['txt', 'json', 'ndjson'].indexOf(mode) >= 0) {
            format = mode
            mode = 'w'
        } else {
            mode = (['w', 'a'].indexOf(mode) >= 0) ? mode : 'w'
        }
    } else mode = 'w'

    format = (['txt', 'json', 'ndjson'].indexOf(format) >= 0) ? format : path.extname(file).replace(".", '')

    switch (format) {

        case "json":
            data = JSON.stringify(data, null, 2)
            break;

        case "ndjson":
            data = Array.isArray(data) ? data : [data];
            let out = '';
            data.forEach(item => {
                out += JSON.stringify(item) + '\n';
            });
            data = out
            break;

        default:
            data = (typeof (data) == 'string') ? data : JSON.stringify(data)
    }

    md.sync(path.dirname(file));

    let option = {
        flag: mode,
        encoding: 'utf8'
    }

    fs.writeFileSync(file, data, option)

    // console.log(`File [${file}] has been saved!`)

}


function readline(file, lineFn, doneFn) {
    let l = rl.createInterface({
        input: fs.createReadStream(file)
    });

    if (typeof lineFn !== "function")
        lineFn = (str) => console.log(str)

    l.on('line', lineFn);

    if (typeof doneFn !== "function")
        doneFn = () => console.log(`${file} read is done!`)

    l.on('close', doneFn);
}

module.exports = {

    glob: (globpath) => glob.sync(globpath),
    // 写文件
    write: (file, data, mode, format) => write(file, data, mode, format),
    // 读文件
    read: (file, format, code) => read(file, format, code),
    // 读单行
    readline: (file, lineFn, doneFn) => readline(file, lineFn, doneFn),
    // 检查文件是否存在
    exist: (file) => fs.existsSync(file),

    // 返回文件最后更新时间
    info: (file) => (fs.existsSync(file)) ? fs.statSync(file) : 0,

    // 创建目录
    mkdir: (file) => md.sync(path.dirname(file)),
    // 返回文件名
    basename: (file) => path.basename(file)
}

/*  */