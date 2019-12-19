let cmd = require('cmd-promise');


const adb = {
    ipflush: async () => {
        console.log('ipflush: mobile  svc data restart .')
        let cmdstring = `adb shell svc data disable && adb shell svc data enable`
        const execOptions = { timeout: 1000 }

        let out = await cmd(cmdstring)
        console.log("ipflush run result:"+JSON.stringify(out))

    }
};
module.exports = adb;

// (async () => {
//     await adb.ipflush()
//     console.log(1)
// })()
// adb.ipflush()