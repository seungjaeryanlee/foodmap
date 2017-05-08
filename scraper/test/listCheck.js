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
    });
    describe('some tokens between are not food', function() {
        describe('AND separator', function(){
            it('listCheck(\"veggie and hummus and bread\") should order-ignored equal [\"Veggie\", \"Hummus\", \"Bread\"]', function() {
                assert.deepEqual(scraper.listCheck("veggie and hummus and bread").sort(), ["Veggie", "Hummus", "Bread"].sort());
            })
        });
        describe('OR separator', function(){
            it('listCheck(\"apple or orange or melon\") should order-ignored equal [\"Apple\", \"Orange\", \"Melon\"]', function() {
                assert.deepEqual(scraper.listCheck("apple or orange or melon").sort(), ["Apple", "Orange", "Melon"].sort());
            })
        });
        describe('comma separator', function(){
            it('listCheck(\"burger, fries, hotdog\") should order-ignored equal [\"Burger\", \"Fries\", \"Hotdog\"]', function() {
                assert.deepEqual(scraper.listCheck("burger, fries, hotdog").sort(), ["Burger", "Fries", "Hotdog"].sort());
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