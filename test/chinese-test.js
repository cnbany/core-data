require("should")
const chinese = require("../lib/chinese")

describe('Chinese', function () {

    context('#s2t()', function () {
        it(' 繁体字 => 繁體字 ', function () {
            chinese.s2t("繁体字").should.equal("繁體字")
        });
    });

    context('#t2s()', function () {
        it(' 簡體字 => 简体字 ', function () {
            chinese.t2s("簡體字").should.equal("简体字")
        });
    });

    context('#ist()', function () {
        it(' 簡體字 是否包含繁体 : true ', function () {
            chinese.ist("簡體字").should.be.true
        });

        it(' 简体字 是否包含繁体 : false ', function () {
            chinese.ist("簡體字").should.be.false
        });

    });


});