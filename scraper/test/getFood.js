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
        it('getFood(\"burrito taco\") should order-ignored equal [\"Burrito\", \"Taco\"]', function() {
            assert.deepEqual(app.getFood("burrito taco").sort(), ["Burrito", "Taco"].sort());
        })
        it('getFood(\"taco burrito\") should order-ignored equal [\"Burrito\", \"Taco\"]', function() {
            assert.deepEqual(app.getFood("taco burrito").sort(), ["Burrito", "Taco"].sort());
        })
        it('getFood(\"come and get bagel and muffin\") should order-ignored equal [\"Bagel\", \"Muffin\"]', function() {
            assert.deepEqual(app.getFood("come and get bagel and muffin").sort(), ["Bagel", "Muffin"].sort());
        })
    })
    describe('case-insensitive match', function() {
        it('getFood(\"Mehek with milk\") should order-ignored equal [\"Mehek\", \"Milk\"]', function() {
            assert.deepEqual(app.getFood("Mehek with milk").sort(), ["Mehek", "Milk"].sort());
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
        it('getFood(\"asdf popcorn\tasdf juice asdf") should order-ignored equal [\"Juice\", \"Popcorn\"] not [ \"Ice\", \"Juice\", \"Pop\", \"Popcorn\"]', function() {
            assert.deepEqual(app.getFood("asdf popcorn\tasdf juice asdf").sort(), ["Juice", "Popcorn"].sort());
        })
    })
    describe('plural forms', function(){
        it('getFood(\"donuts\") should equal [\"Donuts\"]', function() {
            assert.deepEqual(app.getFood("donuts"), ["Donuts"]);
        })
        it('getFood(\"Doughnuts!\") should equal [\"Doughnuts\"]', function() {
            assert.deepEqual(app.getFood("Doughnuts!"), ["Doughnuts"]);
        })
    });
    describe('comma-separated list of food', function(){
        it('getFood(\"Bobas,fries\") should order-ignored equal [\"Bobas\", \"Fries\"]', function() {
            assert.deepEqual(app.getFood("Bobas,fries").sort(), ["Bobas", "Fries"].sort());
        })
        it('getFood(\"Ziti, qdoba\") should order-ignored equal [\"Ziti\", \"Qdoba\"]', function() {
            assert.deepEqual(app.getFood("Ziti, qdoba").sort(), ["Ziti", "Qdoba"].sort());
        })
        it('getFood(\"PANERA , quinoa\") should order-ignored equal [\"Panera\", \"Quinoa\"]', function() {
            assert.deepEqual(app.getFood("PANERA , quinoa").sort(), ["Panera", "Quinoa"].sort());
        })
    });
    describe('multi-word foods', function(){
        it('getFood(\"ice cream\") should equal [\"Ice cream\"]', function() {
            assert.deepEqual(app.getFood("ice cream"), ["Ice cream"]);
        })
    });

    describe('biggest substring', function(){});
    describe('fuzzy matching', function(){});
});