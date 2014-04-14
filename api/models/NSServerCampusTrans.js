/**
 * NSServerCampusTrans
 *
 * @module      :: Model NSServerCampusTrans
 * @description :: Contains translation strings for NSServerCampus model.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    tableName: 'nextsteps_campus_trans',

    attributes: {

        campus_id       : 'INTEGER',

        language_code	: 'STRING',

        campus_label	: 'STRING',

        long_name	: 'STRING'
    },

/*
    // Life cycle callbacks
    afterCreate: function(newEntry, cb) {
        // Tell the campus there's an update
        NSServerCampus.findOne(newEntry.campus_id)
        .then(function(campus){
            NSServerCampus.afterUpdate(campus, cb);
        })
        .fail(function(err){
            cb(err);
        });
    },

    afterUpdate: function(entry, cb) {
        // same as after create
        NSServerCampusTrans.afterCreate(entry, cb);
    }
*/
};
