require("should")
const msid = require("../src/msid")


describe('msid', async function () {
    let idms = new msid("scenic")
    // before(async function () {
    //     this.timeout(100000);
    //     await idms.load()
    // });


    context('#get()', async function () {
        it('B020202D9F id is f2bf25d784c8', async function () {
            let id = await idms.get("B020202D9F")
            console.log(id)
            id.should.be.equal("f2bf25d784c8");
        });
    });


});