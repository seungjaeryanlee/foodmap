/******************************************************************************/
/* db.js                                                                      */
/* Author: Michael Friedman                                                   */
/*                                                                            */
/* Module for database operations required in app.js. Implements two          */
/* operations, 'insert' and 'delete', for both the sqlite version of the      */
/* database (for use during development) and the postgres version of the      */
/* database (for use in the deployed production version).                     */
/******************************************************************************/

var sqlite3_lib = require('sqlite3').verbose();
var pg = require('pg');

var sqlite3 = new sqlite3_lib.Database(__dirname + '/../foodmap_proj/db.sqlite3');

// https://devcenter.heroku.com/articles/heroku-postgresql#connecting-in-node-js
pg.defaults.ssl = true;


// Constants specifying database schemas (table and column names)
var OFFERINGS = {
    NAME: 'foodmap_app_offering',
    COLUMNS: {
        ID: 'id',
        TIMESTAMP: 'timestamp',
        LOCATION_ID: 'location_id',
        TITLE: 'title',
        DESCRIPTION: 'description',
        IMAGE: 'image',
        THREAD_ID: 'thread_id'
    }
};

var LOCATIONS = {
    NAME: 'foodmap_app_location',
    COLUMNS: {
        ID: 'id',
        NAME: 'name',
        LAT: 'lat',
        LNG: 'lng'
    }
};


// Database operations
var db = {

    // Sqlite implementation
    sqlite: {
        /**
         * Insert given entry to the database
         *
         * @param {Object} entry The entry to be inserted to the database
         */
        insert: function(entry) {
            // FIXME: Not run if no location found?
            sqlite3.serialize(function() {
                sqlite3.each("SELECT " + LOCATIONS.COLUMNS.ID + " FROM " + LOCATIONS.NAME + " WHERE " + LOCATIONS.COLUMNS.NAME + " = ?",
                    [entry.location], function(err, row) {

                    if(err) {
                        console.log(err);
                    }
                    var locationId = row.id;

                    sqlite3.serialize(function() {
                        if(typeof entry.image === 'undefined') {
                            // FIXME: Temporarily don't have thread_id
                            var columns = "(" + OFFERINGS.COLUMNS.TIMESTAMP + ", " + OFFERINGS.COLUMNS.LOCATION_ID + ", " + OFFERINGS.COLUMNS.TITLE + ", "
                                + OFFERINGS.COLUMNS.DESCRIPTION + ")";
                            var stmt = sqlite3.prepare("INSERT INTO " + OFFERINGS.NAME + " " + columns + " VALUES (?, ?, ?, ?)");
                            stmt.run(entry.timestamp, locationId, entry.food.join(', '), entry.body);
                            stmt.finalize();
                        }
                        else {
                            var columns = "(" + OFFERINGS.COLUMNS.TIMESTAMP + ", " + OFFERINGS.COLUMNS.LOCATION_ID + ", " + OFFERINGS.COLUMNS.TITLE + ", "
                                + OFFERINGS.COLUMNS.DESCRIPTION + ", " + OFFERINGS.COLUMNS.IMAGE + ")";
                            var stmt = sqlite3.prepare("INSERT INTO " + OFFERINGS.NAME + " " + columns + " VALUES (?, ?, ?, ?, ?)");
                            stmt.run(entry.timestamp, locationId, entry.food.join(', '), entry.body, entry.image.name);
                            stmt.finalize();
                        }
                    });
                    console.log("Entry inserted to database.");
                });
            });
        },


        /**
         * Delete given entry from the database
         *
         * @param {Object} entry The entry to be deleted from the database
         */
        delete: function(entry) {
            // If there is an entry with the given ThreadID, Delete
            db.serialize(function() {
                db.run("DELETE FROM " + OFFERINGS.NAME + " WHERE " + OFFERINGS.COLUMNS.THREAD_ID + "=(?)", entry.threadId);
            });
            console.log("Entry deleted from database.");

            // FIXME: False positive?
        }
    },


    // Postgres implementation
    postgres: {
        /**
         * Insert given entry to the database
         *
         * @param {Object} entry The entry to be inserted to the database
         */
        insert: function(entry) {
            pg.connect(process.env.DATABASE_URL, function(err, client) {
                if (err) throw err;
                console.log('Connected to postgres! Getting schemas...');

                client.query('SELECT ' + LOCATIONS.COLUMNS.ID + ' FROM ' + LOCATIONS.NAME + ' WHERE ' + LOCATIONS.COLUMNS.NAME + ' = $1',
                    [entry.location], function(err, result) {

                    if (err) throw err;

                    // console.log(entry.location);
                    // console.log(result);
                    if(!result || !result.rows || !result.rows[0]) { return; }
                    var locationId = result.rows[0].id;

                    if(typeof entry.image === 'undefined') {
                        var columns = "(" + OFFERINGS.COLUMNS.TIMESTAMP + ", " + OFFERINGS.COLUMNS.LOCATION_ID + ", " + OFFERINGS.COLUMNS.TITLE + ", "
                                + OFFERINGS.COLUMNS.DESCRIPTION + ", " + OFFERINGS.COLUMNS.THREAD_ID + ")";
                        client.query('INSERT INTO ' + OFFERINGS.NAME + ' ' + columns + ' VALUES ($1, $2, $3, $4, $5)',
                            [entry.timestamp, locationId, entry.food.join(', '), entry.body, entry.threadId], function(c,e){ client.end(); });
                    }
                    else {
                        var columns = "(" + OFFERINGS.COLUMNS.TIMESTAMP + ", " + OFFERINGS.COLUMNS.LOCATION_ID + ", " + OFFERINGS.COLUMNS.TITLE + ", "
                                + OFFERINGS.COLUMNS.DESCRIPTION + ", " + OFFERINGS.COLUMNS.THREAD_ID + ", " + OFFERINGS.COLUMNS.IMAGE + ")";
                        client.query('INSERT INTO ' + OFFERINGS.NAME + ' ' + columns + ' VALUES ($1, $2, $3, $4, $5, $6)',
                            [entry.timestamp, locationId, entry.food.join(', '), entry.body, entry.threadId, entry.image.name], function(c,e){ client.end(); });
                    }

                    console.log("Entry inserted to database.");
                });
            });
        },


        /**
         * Delete given entry from the database
         *
         * @param {Object} entry The entry to be deleted from the database
         */
        delete: function(entry) {
            // If there is an entry with the given ThreadID, Delete
            pg.connect(process.env.DATABASE_URL, function(err, client) {
                if (err) throw err;
                console.log('Connected to postgres! Getting schemas...');

                client.query('DELETE FROM ' + OFFERINGS.NAME + ' WHERE ' + OFFERINGS.COLUMNS.THREAD_ID + '=($1)', [entry.threadId], function(c,e){ client.end(); });
                console.log("Entry deleted from database.");
            });
            // FIXME: False positive?
        }
    }
};


// Make these implementations available to clients
module.exports.db = db;
