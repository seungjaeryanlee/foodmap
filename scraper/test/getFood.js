var assert = require("assert");
var app = require('../app.js');

describe('getFood()', function() {
    describe('no match', function() {
        it('getFood(\"\") should equal []', function() {
            assert.deepEqual(app.getFood(""), []);
        })
        it('getFood(\"xyz\") should equal []', function() {
            assert.deepEqual(app.getFood("xyz"), []);
        })
    })
    describe('one match', function() {
        it('getFood(\"pizza\") should equal [\"pizza\"]', function() {
            assert.deepEqual(app.getFood("pizza"), ["pizza"]);
        })
        it('getFood(\"lots of sushi\") should equal [\"sushi\"]', function() {
            assert.deepEqual(app.getFood("lots of sushi"), ["sushi"]);
        })
    })
    describe('multiple matches', function() {
        it('getFood(\"burrito taco\") should equal [\"burrito\", \"taco\"]', function() {
            assert.deepEqual(app.getFood("burrito taco"), ["burrito", "taco"]);
        })
        it('getFood(\"taco burrito\") should equal [\"burrito\", \"taco\"]', function() {
            assert.deepEqual(app.getFood("taco burrito"), ["burrito", "taco"]);
        })
        it('getFood(\"come and get bagel and muffin\") should equal [\"bagel\", \"muffin\"]', function() {
            assert.deepEqual(app.getFood("come and get bagel and muffin"), ["bagel", "muffin"]);
        })
    })
    describe('case-insensitive match', function() {
        it('getFood(\"Mehek with milk\") should equal [\"mehek\", \"milk\"]', function() {
            assert.deepEqual(app.getFood("Mehek with milk"), ["mehek", "milk"]);
        })
        it('getFood(\"PAPA JOHNS\") should equal [\"papa johns\"]', function() {
            assert.deepEqual(app.getFood("PAPA JOHNS"), ["papa johns"]);
        })
        it('getFood(\"Get excited for TiRaMiSu!\") should equal [\"tiramisu\"]', function() {
            assert.deepEqual(app.getFood("Get excited for TiRaMiSu!"), ["tiramisu"]);
        })
    })
    describe('biggest substring', function(){});
});