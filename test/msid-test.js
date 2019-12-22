require("should")
const msid = require("../src/msid")


describe('msid', async function () {
    let idms = new msid("scenic")
    before(async function () {
        this.timeout(100000);
        await idms.load()
    });


    context('#get()', async function () {
        it('B020202D9F id is a0b5a5bbad7c', async function () {
            let id = idms.get("B020202D9F")
            console.log(id)
            id.should.be.equal("a0b5a5bbad7c");
        });
    });


});