var assert = require("assert");
var app = require('../app.js');

describe('getLocation()', function() {
    describe('no match', function() {
        it('getLocation(\"\") should equal []', function() {
            assert.deepEqual(app.getLocation(""), []);
        })
        it('getLocation(\"qqq\") should equal []', function() {
            assert.deepEqual(app.getLocation("xyz"), []);
        })
    })
    describe('one match', function() {
        it('getLocation(\"clapp\") should equal [\"clapp\"]', function() {
            assert.deepEqual(app.getLocation("clapp"), ["clapp"]);
        })
        it('getLocation(\"come to dod!\") should equal [\"dod\"]', function() {
            assert.deepEqual(app.getLocation("come to dod!"), ["dod"]);
        })
    })
    describe('multiple matches', function() {})
    describe('case-insensitive match', function() {
        it('getLocation(\"EQuad has food\") should equal [\"equad\"]', function() {
            assert.deepEqual(app.getLocation("EQuad has food"), ["equad"]);
        })
        it('getFood(\"FRIST HAS FOOD\") should equal [\"frist\"]', function() {
            assert.deepEqual(app.getLocation("FRIST HAS FOOD"), ["frist"]);
        })
        it('getLocation(\"Pizza at CoLoNiAl\") should equal [\"colonial\"]', function() {
            assert.deepEqual(app.getLocation("Pizza at CoLoNiAl"), ["colonial"]);
        })
    })
    describe('biggest substring', function(){});
    describe('fuzzy matching', function(){});
});