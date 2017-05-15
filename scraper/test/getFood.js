/******************************************************************************/
/* getFood.js                                                                 */
/* Author: Seung Jae Lee                                                      */
/*                                                                            */
/* This is a mocha test file that tests getFood() function in scraper.js.     */
/******************************************************************************/

var assert = require("assert");
var scraper = require('../scraper.js');

describe('getFood()', function() {
    describe('no match', function() {
        it('getFood(\"\") should equal []', function() {
            assert.deepEqual(scraper.getFood(""), []);
        })
        it('getFood(\"xyz\") should equal []', function() {
            assert.deepEqual(scraper.getFood("xyz"), []);
        })
    })
    describe('one match', function() {
        it('getFood(\"pizza\") should equal [\"Pizza\"]', function() {
            assert.deepEqual(scraper.getFood("pizza"), ["Pizza"]);
        })
        it('getFood(\"lots of sushi\") should equal [\"Sushi\"]', function() {
            assert.deepEqual(scraper.getFood("lots of sushi"), ["Sushi"]);
        })
    })
    describe('multiple matches', function() {
        it('getFood(\"burrito taco\") should order-ignored equal [\"Burrito\", \"Taco\"]', function() {
            assert.deepEqual(scraper.getFood("burrito taco").sort(), ["Burrito", "Taco"].sort());
        })
        it('getFood(\"taco burrito\") should order-ignored equal [\"Burrito\", \"Taco\"]', function() {
            assert.deepEqual(scraper.getFood("taco burrito").sort(), ["Burrito", "Taco"].sort());
        })
        it('getFood(\"come and get bagel and muffin\") should order-ignored equal [\"Bagel\", \"Muffin\"]', function() {
            assert.deepEqual(scraper.getFood("come and get bagel and muffin").sort(), ["Bagel", "Muffin"].sort());
        })
    })
    describe('case-insensitive match', function() {
        it('getFood(\"Mehek with milk\") should order-ignored equal [\"Mehek\", \"Milk\"]', function() {
            assert.deepEqual(scraper.getFood("Mehek with milk").sort(), ["Mehek", "Milk"].sort());
        })
        it('getFood(\"PAPA JOHNS\") should equal [\"Papa johns\"]', function() {
            assert.deepEqual(scraper.getFood("PAPA JOHNS"), ["Papa johns"]);
        })
        it('getFood(\"Get excited for TiRaMiSu!\") should equal [\"Tiramisu\"]', function() {
            assert.deepEqual(scraper.getFood("Get excited for TiRaMiSu!"), ["Tiramisu"]);
        })
    })
    describe('punctuation deletion', function() {
        it('getFood(\"Time for P.I.Z.Z.A\") should equal [\"Pizza\"]', function() {
            assert.deepEqual(scraper.getFood("Time for P.I.Z.Z.A"), ["Pizza"]);
        })
        it('getFood(\"Food from Olive\'s\") should equal [\"Olives\"]', function() {
            assert.deepEqual(scraper.getFood("Food from Olive\'s"), ["Olives"]);
        })
    })
    describe('words not substrings', function() {
        it('getFood(\"population\") should equal []', function() {
            assert.deepEqual(scraper.getFood("population"), []);
        })
        it('getFood(\"veggie!\") should equal [\"Veggie\"] not [\"Egg\", \"Veggie\"]', function() {
            assert.deepEqual(scraper.getFood("veggie!"), ["Veggie"]);
        })
        it('getFood(\"asdf popcorn\tasdf juice asdf") should order-ignored equal [\"Juice\", \"Popcorn\"] not [ \"Ice\", \"Juice\", \"Pop\", \"Popcorn\"]', function() {
            assert.deepEqual(scraper.getFood("asdf popcorn\tasdf juice asdf").sort(), ["Juice", "Popcorn"].sort());
        })
    })
    describe('plural forms', function(){
        it('getFood(\"donuts\") should equal [\"Donuts\"]', function() {
            assert.deepEqual(scraper.getFood("donuts"), ["Donuts"]);
        })
        it('getFood(\"Doughnuts!\") should equal [\"Doughnuts\"]', function() {
            assert.deepEqual(scraper.getFood("Doughnuts!"), ["Doughnuts"]);
        })
    });
    describe('comma-separated list of food', function(){
        it('getFood(\"Bobas,fries\") should order-ignored equal [\"Bobas\", \"Fries\"]', function() {
            assert.deepEqual(scraper.getFood("Bobas,fries").sort(), ["Bobas", "Fries"].sort());
        })
        it('getFood(\"Ziti, qdoba\") should order-ignored equal [\"Ziti\", \"Qdoba\"]', function() {
            assert.deepEqual(scraper.getFood("Ziti, qdoba").sort(), ["Ziti", "Qdoba"].sort());
        })
        it('getFood(\"PANERA , quinoa\") should order-ignored equal [\"Panera\", \"Quinoa\"]', function() {
            assert.deepEqual(scraper.getFood("PANERA , quinoa").sort(), ["Panera", "Quinoa"].sort());
        })
    });
    describe('multi-word foods', function(){
        it('getFood(\"ice cream\") should equal [\"Ice cream\"]', function() {
            assert.deepEqual(scraper.getFood("ice cream"), ["Ice cream"]);
        })
    });

    describe('no duplicates', function() {
        it('getFood(\"orange, orange, orange\") should equal [\"Orange\"]', function() {
            assert.deepEqual(scraper.getFood("orange, orange, orange"), ["Orange"]);
        }) 
    });

    describe('listCheck() works inside getFood', function() {
        describe('AND separator', function(){
            it('getFood(\"muffins and 123 and bagels\") should order-ignored equal [\"Muffins\", \"123\", \"Bagels\"]', function() {
                assert.deepEqual(scraper.getFood("muffins and 123 and bagels").sort(), ["Muffins", "123", "Bagels"].sort());
            })
        });
        describe('OR separator', function(){
            it('getFood(\"froyo or something or sundae\") should order-ignored equal [\"Froyo\", \"Something\", \"Sundae\"]', function() {
                assert.deepEqual(scraper.getFood("froyo or something or sundae").sort(), ["Froyo", "Something", "Sundae"].sort());
            })
        });
        describe('comma separator', function(){
            it('getFood(\"penne, lingueeni, spaghetti\") should order-ignored equal [\"Penne\", \"Lingueeni\", \"Spaghetti\"]', function() {
                assert.deepEqual(scraper.getFood("penne, lingueeni, spaghetti").sort(), ["Penne", "Lingueeni", "Spaghetti"].sort());
            })
        });
    });
});