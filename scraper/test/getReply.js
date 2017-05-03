var assert = require("assert");
var app = require('../app.js');

describe('getReply()', function() {
    it('No previous email', function() {
        var text = "Just a random string";
        assert.equal(app.getReply(text), text);
    })
    it('One previous email', function() {
        var text = "Subject\nText\r\nOn Sun, Apr 30, 2017 at 14:47 Samantha N <snewman@princeton.edu> wrote:\r\n\r\n> Text\r\n\r\n";
        assert.equal(app.getReply(text), "Subject\nText\r\n");
    })

    it('Two previous emails', function() {
        var text = "Re: [FreeFood] There is Food!\nGone!\r\nOn Sun, Apr 30, 2017 at 14:47 Ryan <seungjl@princeton.edu> wrote:\r\n\r\n> Even more food !!\r\n>\r\n> On Sun, Apr 30, 2017 at 14:42 Ryan <seungjl@princeton.edu> wrote:\r\n>\r\n>> So much food!\r\n>\r\n>\r\n\r\n";
        assert.equal(app.getReply(text), "Re: [FreeFood] There is Food!\nGone!\r\n");
    })
});