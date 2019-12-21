require("should")
const redis = require("../lib/redis.js")

describe('redis', function () {

    context('service run is ok!',  function () {
        it("#set()", async function () {
            let kvs = {"k1":"v1","k2":"v2"}
            let res = await redis.set(kvs,"redis")
            res.should.have.length(2)
        });

        it('#get', async function () {
            let res = await redis.get("redis")
            console.log(JSON.stringify(res))
        });

    });


});