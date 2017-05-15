/******************************************************************************/
/* getRequestType.js                                                          */
/* Author: Seung Jae Lee                                                      */
/*                                                                            */
/* This is a mocha test file that tests getRequestType() function in          */
/* scraper.js.                                                                */
/******************************************************************************/

var assert = require("assert");
var scraper = require('../scraper.js');

describe('getRequestType()', function() {
    describe('delete request', function() {
        it('getRequestType(\"all gone\") should equal DELETE', function() {
            assert.equal(scraper.getRequestType("all gone"), scraper.DELETE);
        })
        it('getRequestType(\"ALL Gone\") should equal DELETE', function() {
            assert.equal(scraper.getRequestType("ALL Gone"), scraper.DELETE);
        })
        it('getRequestType(\"They\'re all gone\") should equal DELETE', function() {
            assert.equal(scraper.getRequestType("They're all gone"), scraper.DELETE);
        })
        it('getRequestType(\"all\' gone\") should equal DELETE', function() {
            assert.equal(scraper.getRequestType("all' gone"), scraper.DELETE);
        })
    })
    describe('insert request', function() {
        it('getRequestType(\"\") should equal INSERT', function() {
            assert.equal(scraper.getRequestType(""), scraper.INSERT);
        })
        it('getRequestType(\"food at frist\") should equal INSERT', function() {
            assert.equal(scraper.getRequestType("food at frist"), scraper.INSERT);
        })
    })
});