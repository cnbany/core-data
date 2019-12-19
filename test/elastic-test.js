require("should")
const elastic = require("../lib/elastic")

describe('elastic', function () {

    const es = new elastic("index-test")

    context('#s2t()', function () {
        it(' 繁体字 => 繁體字 ', function () {
            chinese.s2t("繁体字").should.equal("繁體字")
        });
    });



});