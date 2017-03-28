var assert = require("assert");
var app = require('../app.js');

describe('getRequestType()', function() {
    describe('delete request', function() {
        it('getRequestType(\"all gone\") should equal DELETE', function() {
            assert.equal(app.getRequestType("all gone"), app.DELETE);
        })
        it('getRequestType(\"ALL Gone\") should equal DELETE', function() {
            assert.equal(app.getRequestType("ALL Gone"), app.DELETE);
        })
        it('getRequestType(\"They\'re all gone\") should equal DELETE', function() {
            assert.equal(app.getRequestType("They're all gone"), app.DELETE);
        })
        it('getRequestType(\"all\' gone\") should equal DELETE', function() {
            assert.equal(app.getRequestType("all' gone"), app.DELETE);
        })
    })
    describe('insert request', function() {
        it('getRequestType(\"\") should equal INSERT', function() {
            assert.equal(app.getRequestType(""), app.INSERT);
        })
        it('getRequestType(\"food at frist\") should equal INSERT', function() {
            assert.equal(app.getRequestType("food at frist"), app.INSERT);
        })
    })
});