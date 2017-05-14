var assert = require("assert");
var scraper = require('../scraper.js');

describe('getTimestampFromMime()', function() {
    it('getTimestampFromMime() should return email was sent in datetime format', function() {
        var message = 
        {
            "id": "15b058637c3f3884",
            "threadId": "15b058637c3f3884",
            "labelIds": [
                "UNREAD",
                "IMPORTANT",
                "SENT",
                "INBOX"
            ],
            "snippet": "",
            "historyId": "3790",
            "internalDate": "1490446333000",
        };
        var timestamp = scraper.getTimestampFromMime(message);
        assert.equal(timestamp, "2017-03-25 12:52:13");
    })
});