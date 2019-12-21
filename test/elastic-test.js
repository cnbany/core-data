require("should")
const elastic = require("../lib/elastic")

describe('elastic', function () {
    let db = new elastic("index")

    context('#count()', function () {
        it('count() is Number', async function () {
            let count = await db.count()
            console.log(count)
            count.should.be.Number()
                .and.be.aboveOrEqual(0);
        });
    });

    context('#import(file)', function () {
        it('import a file', async function () {
            let c1 = await db.count();
            await db.import(__dirname + `/dataset/elastis.import.ndjson`);
            let c2 = await db.count();
            (c2 - c1).should.be.aboveOrEqual(0);
        });
    });

});