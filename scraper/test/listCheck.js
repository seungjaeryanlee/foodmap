var assert = require("assert");
var scraper = require('../scraper.js');

describe('listCheck', function() {
    describe('all tokens are food', function() {
        describe('AND separator', function(){
            it('listCheck(\"pizza and soda\") should order-ignored equal [\"Pizza\", \"Soda\"]', function() {
                assert.deepEqual(scraper.listCheck("pizza and soda").sort(), ["Pizza", "Soda"].sort());
            })
        });
        describe('OR separator', function(){
            it('listCheck(\"coke or pepsi\") should order-ignored equal [\"Coke\", \"Pepsi\"]', function() {
                assert.deepEqual(scraper.listCheck("coke or pepsi").sort(), ["Coke", "Pepsi"].sort());
            })
        });
        describe('comma separator', function(){
            it('listCheck(\"burrito, nacho\") should order-ignored equal [\"Burrito\", \"Nacho\"]', function() {
                assert.deepEqual(scraper.listCheck("burrito, nacho").sort(), ["Burrito", "Nacho"].sort());
            })
            it('listCheck(\"bread,butter\") should order-ignored equal [\"Bread\", \"Butter\"]', function() {
                assert.deepEqual(scraper.listCheck("bread,butter").sort(), ["Bread", "Butter"].sort());
            })
            it('listCheck(\"rice , beans\") should order-ignored equal [\"Rice\", \"Beans\"]', function() {
                assert.deepEqual(scraper.listCheck("rice , beans").sort(), ["Rice", "Beans"].sort());
            })
        });
        describe('mixed separators', function(){
            it('listCheck(\"panera, olives, and princeton pi or mehek\") should order-ignored equal [\"Panera\", \"Olives\", \"Princeton pi\", \"Mehek\"]', function() {
                assert.deepEqual(scraper.listCheck("panera, olives, and princeton pi or mehek").sort(), ["Panera", "Olives", "Princeton pi", "Mehek"].sort());
            })
        });
    });
    describe('some tokens between are not food', function() {
        describe('AND separator', function(){
            it('listCheck(\"veggie and hommos and bread\") should order-ignored equal [\"Veggie\", \"Hommos\", \"Bread\"]', function() {
                assert.deepEqual(scraper.listCheck("veggie and hommos and bread").sort(), ["Veggie", "Hommos", "Bread"].sort());
            })
        });
        describe('OR separator', function(){
            it('listCheck(\"apple or strawbarry or melon\") should order-ignored equal [\"Apple\", \"Strawbarry\", \"Melon\"]', function() {
                assert.deepEqual(scraper.listCheck("apple or strawbarry or melon").sort(), ["Apple", "Strawbarry", "Melon"].sort());
            })
        });
        describe('comma separator', function(){
            it('listCheck(\"burger, fryes, hotdog\") should order-ignored equal [\"Burger\", \"Fryes\", \"Hotdog\"]', function() {
                assert.deepEqual(scraper.listCheck("burger, fryes, hotdog").sort(), ["Burger", "Fryes", "Hotdog"].sort());
            })
        });
        describe('mixed separators', function(){
            it('listCheck(\"mango, peach, or ASDF and fruit\") should order-ignored equal [\"Mango\", \"Peach\", \"Asdf\", \"Fruit\"]', function() {
                assert.deepEqual(scraper.listCheck("mango, peach, or asdf and fruit").sort(), ["Mango", "Peach", "Asdf", "Fruit"].sort());
            })
        });
    });
    describe('plural foods should stay plural', function() {
        it('listCheck(\"melons\") should order-ignored equal [\"Melons\"]', function() {
            assert.deepEqual(scraper.listCheck("melons").sort(), ["Melons"].sort());
        })
    });
    describe('AND or OR separator in the word should not be detected', function() {
        it('listCheck(\"sandwich and corn\") should order-ignored equal [\"Corn\", \"Sandwich\"]', function() {
            assert.deepEqual(scraper.listCheck("sandwich and corn").sort(), ["Corn", "Sandwich"].sort());
        })
    });

});