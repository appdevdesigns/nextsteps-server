/**
 * NSServerUserCampus
 *
 * @module      :: Model NSServerUserCampus
 * @description :: Association model for correlating users and campuses.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var AD = require('ad-utils');
module.exports = {

    connection: ['nextStepsServer'],

    tableName: 'nextsteps_user_campus',


    attributes: {

        user_uuid	: 'STRING',

        campus_uuid	: 'STRING',


        campus:function () {

            var dfd = AD.sal.Deferred();

            NSServerCampus.findOne({ campus_uuid: this.campus_uuid})
            .fail(function(err){
                AD.error('ERROR: could not get steps from campus ['+this.campus_uuid+']', err);
                dfd.reject(err);
            })
            .then(function(campus){

                // return what we have
                dfd.resolve(campus);
            });

            return dfd;
        },

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
