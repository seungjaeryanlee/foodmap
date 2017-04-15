var assert = require("assert");
var app = require('../app.js');

describe('getLocation()', function() {
    describe('no match', function() {
        it('getLocation(\"\") should equal \"\"', function() {
            assert.equal(app.getLocation(""), "");
        })
        it('getLocation(\"qqq\") should equal \"\"', function() {
            assert.equal(app.getLocation("xyz"), "");
        })
    })
    describe('one match', function() {
        it('getLocation(\"clapp\") should equal \"1927 - Clapp Hall\"', function() {
            assert.equal(app.getLocation("clapp"), "1927 - Clapp Hall");
        })
        it('getLocation(\"come to dod hall!\") should equal \"Dod Hall\"', function() {
            assert.equal(app.getLocation("come to dod hall!"), "Dod Hall");
        })
    })
    describe('case-insensitive match', function() {
        it('getLocation(\"EQuad has food\") should equal \"Enginerring QUAD\"', function() {
            assert.equal(app.getLocation("EQuad has food"), "Enginerring QUAD");
        })
        it('getLocation(\"FRIST HAS FOOD\") should equal \"Frist Campus Center\"', function() {
            assert.equal(app.getLocation("FRIST HAS FOOD"), "Frist Campus Center");
        })
        it('getLocation(\"Pizza at CoLoNiAl ClUb\") should equal \"Colonial Club\"', function() {
            assert.equal(app.getLocation("Pizza at CoLoNiAl ClUb"), "Colonial Club");
        })
    })
    describe('punctuation deletion', function() {
        it('getLocation(\"Come to F,r,i,s,t\") should equal \"Frist Campus Center\"', function() {
            assert.equal(app.getLocation("Come to F,r,i,s,t"), "Frist Campus Center");
        })
        it('getLocation(\"Edward\'s Hall\") should equal \"Edwards Hall\"', function() {
            assert.equal(app.getLocation("Edward\'s Hall"), "Edwards Hall");
        })
    })
    describe('biggest substring', function(){});
});