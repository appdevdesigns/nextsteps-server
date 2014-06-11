/**
 * NSServerUserCampus
 *
 * @module      :: Model NSServerUserCampus
 * @description :: Association model for correlating users and campuses.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    connection: ['nextStepsServer'],

    tableName: 'nextsteps_user_campus',


    attributes: {

        user_uuid	: 'STRING',

        campus_uuid	: 'STRING'

    },


/*
    // ------------------------------------------------------
    // Life cycle callbacks
    // ------------------------------------------------------
    afterCreate: function(newEntry, cb) {


        // Following a create, we want to add a transaction for the associated user.
        // Get the campus and user
        NSServerCampus.findOne({ campus_uuid: newEntry.campus_uuid })
        .fail(function(err){
            cb(err);
        })
        .then(function(campus){

            NSServerUser.findOne({ user_uuid: newEntry.user_uuid })
            .fail(function(err){
                cb(err);
            })
            .then(function(user){

                // Get campus transaction entry
                DBHelper.addTransaction({
                    operation:'create',
                    model:'Campus',
                    obj:campus,
                    user:user
                })
                .fail(function(err){
                    cb(err);
                })
                .then(function(){
                    cb();
                });
            });
        });
    } // afterCreate
*/
};
