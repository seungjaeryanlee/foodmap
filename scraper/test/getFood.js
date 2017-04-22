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
        it('getFood(\"pizza\") should equal [\"Pizza\"]', function() {
            assert.deepEqual(app.getFood("pizza"), ["Pizza"]);
        })
        it('getFood(\"lots of sushi\") should equal [\"Sushi\"]', function() {
            assert.deepEqual(app.getFood("lots of sushi"), ["Sushi"]);
        })
    })
    describe('multiple matches', function() {
        it('getFood(\"burrito taco\") should equal [\"Burrito\", \"Taco\"]', function() {
            assert.deepEqual(app.getFood("burrito taco"), ["Burrito", "Taco"]);
        })
        it('getFood(\"taco burrito\") should equal [\"Burrito\", \"Taco\"]', function() {
            assert.deepEqual(app.getFood("taco burrito"), ["Burrito", "Taco"]);
        })
        it('getFood(\"come and get bagel and muffin\") should equal [\"Bagel\", \"Muffin\"]', function() {
            assert.deepEqual(app.getFood("come and get bagel and muffin"), ["Bagel", "Muffin"]);
        })
    })
    describe('case-insensitive match', function() {
        it('getFood(\"Mehek with milk\") should equal [\"Mehek\", \"Milk\"]', function() {
            assert.deepEqual(app.getFood("Mehek with milk"), ["Mehek", "Milk"]);
        })
        it('getFood(\"PAPA JOHNS\") should equal [\"Papa johns\"]', function() {
            assert.deepEqual(app.getFood("PAPA JOHNS"), ["Papa johns"]);
        })
        it('getFood(\"Get excited for TiRaMiSu!\") should equal [\"Tiramisu\"]', function() {
            assert.deepEqual(app.getFood("Get excited for TiRaMiSu!"), ["Tiramisu"]);
        })
    })
    describe('punctuation deletion', function() {
        it('getFood(\"Time for P.I.Z.Z.A\") should equal [\"Pizza\"]', function() {
            assert.deepEqual(app.getFood("Time for P.I.Z.Z.A"), ["Pizza"]);
        })
        it('getFood(\"Food from Olive\'s\") should equal [\"Olives\"]', function() {
            assert.deepEqual(app.getFood("Food from Olive\'s"), ["Olives"]);
        })
    })
    describe('words not substrings', function() {
        it('getFood(\"population\") should equal []', function() {
            assert.deepEqual(app.getFood("population"), []);
        })
        it('getFood(\"veggie!\") should equal [\"Veggie\"] not [\"Egg\", \"Veggie\"]', function() {
            assert.deepEqual(app.getFood("veggie!"), ["Veggie"]);
        })
        it('getFood(\"asdf popcorn\tasdf juice asdf") should equal [\"Juice\", \"Popcorn\"] not [ \"Ice\", \"Juice\", \"Pop\", \"Popcorn\"]', function() {
            assert.deepEqual(app.getFood("asdf popcorn\tasdf juice asdf"), ["Juice", "Popcorn"]);
        })
    })
    describe('biggest substring', function(){});
    describe('fuzzy matching', function(){});
});