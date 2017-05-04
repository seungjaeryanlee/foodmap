var assert = require("assert");
var scraper = require('../scraper.js');

describe('getLocation()', function() {
    describe('no match', function() {
        it('getLocation(\"\") should equal \"\"', function() {
            assert.equal(scraper.getLocation(""), "");
        })
        it('getLocation(\"qqq\") should equal \"\"', function() {
            assert.equal(scraper.getLocation("xyz"), "");
        })
    })
    describe('one match', function() {
        it('getLocation(\"clapp\") should equal \"1927 - Clapp Hall\"', function() {
            assert.equal(scraper.getLocation("clapp"), "1927 - Clapp Hall");
        })
        it('getLocation(\"come to dod hall!\") should equal \"Dod Hall\"', function() {
            assert.equal(scraper.getLocation("come to dod hall!"), "Dod Hall");
        })
    })
    describe('case-insensitive match', function() {
        it('getLocation(\"EQuad has food\") should equal \"Enginerring QUAD\"', function() {
            assert.equal(scraper.getLocation("EQuad has food"), "Enginerring QUAD");
        })
        it('getLocation(\"FRIST HAS FOOD\") should equal \"Frist Campus Center\"', function() {
            assert.equal(scraper.getLocation("FRIST HAS FOOD"), "Frist Campus Center");
        })
        it('getLocation(\"Pizza at CoLoNiAl ClUb\") should equal \"Colonial Club\"', function() {
            assert.equal(scraper.getLocation("Pizza at CoLoNiAl ClUb"), "Colonial Club");
        })
    })
    describe('punctuation deletion', function() {
        it('getLocation(\"Come to F,r,i,s,t\") should equal \"Frist Campus Center\"', function() {
            assert.equal(scraper.getLocation("Come to F,r,i,s,t"), "Frist Campus Center");
        })
        it('getLocation(\"Edward\'s Hall\") should equal \"Edwards Hall\"', function() {
            assert.equal(scraper.getLocation("Edward\'s Hall"), "Edwards Hall");
        })
    })
    describe('regex match', function() {
        it('getLocation(\"Friend 112\") should equal \"Friend Center\"', function() {
            assert.equal(scraper.getLocation("Friend 112"), "Friend Center");
        })
        it('getLocation(\"Lewis 123\") should equal \"Lewis Library\"', function() {
            assert.equal(scraper.getLocation("Lewis 123"), "Lewis Library");
        })
    })

    describe('biggest substring', function(){
        it('getLocation(\"Ticket holders to Friend Center\") should equal \"Friend Center\"', function() {
            assert.equal(scraper.getLocation("Ticket holders to Friend Center"), "Friend Center");
        })
        it('getLocation(\"Lewis 123, Bring your spoon!\") should equal \"Lewis Library\"', function() {
            assert.equal(scraper.getLocation("Lewis 123, Bring your spoon!"), "Lewis Library");
        })
    });
});