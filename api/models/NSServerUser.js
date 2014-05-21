/**
 * NSServerUser
 *
 * @module      :: Model NSServerUser
 * @description :: A list of users associating the user's NextSteps UUID with CAS GUID.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var AD = require('ad-utils');

module.exports = {

    connection: ['nextStepsServer'],

    tableName: 'nextsteps_user',

    attributes: {


        user_uuid	: 'STRING',


        user_guid	: 'STRING',


        default_lang : 'STRING',


        campuses: function(filter, cb) {

            var dfd = AD.sal.Deferred();

            if (typeof cb == 'undefined') {
                if (typeof filter == 'function') {
                    cb = filter;
                    filter = {};
                }
            }

            filter = filter || {};

            //
            DBHelper.manyThrough(NSServerUserCampus, {user_uuid:this.user_uuid}, NSServerCampus, 'campus_uuid', 'campus_uuid', filter)
            .then(function(listCampuses) {

                // now tell the campuses to translate themselves
                DBHelper.translateList(listCampuses, { language_code:true, name:true })
                .then(function(list) {

                    if (cb) {
                        cb(null, listCampuses);
                    }
                    dfd.resolve(listCampuses);
                })
                .fail(function(err){
                    if (cb) {
                        cb(err);
                    }
                    dfd.reject(err);
                });
            })
            .fail(function(err){

                if (cb) {
                    cb(err);
                }
                dfd.reject(err);
            });

            return dfd;
        }, // campuses


        addCampus: function(campusObj, cb) {
            var dfd = AD.sal.Deferred();
            NSServerUserCampus.create({
                campus_uuid: campusObj.campus_uuid,
                user_uuid: this.user_uuid
            })
            .then(function(obj){
                if (cb) {
                    cb(null);
                }
                dfd.resolve();
            })
            .fail(function(err){
                if (cb) {
                    cb(err);
                }
                dfd.reject(err);
            });
            return dfd;
        } // addCampus

    }, // attributes



    addCampus: function(campusObj, cb) {
        var dfd = AD.sal.Deferred();
        NSServerUserCampus.create({
            campus_uuid: campusObj.campus_uuid,
            user_uuid: this.user_uuid
        })
        .then(function(obj){
            if (cb) {
                cb(null);
            }
            dfd.resolve();
        })
        .fail(function(err){
            if (cb) {
                cb(err);
            }
            dfd.reject(err);
        });
        return dfd;
    },



    addTransaction: function(transaction, cb) {
        var dfd = AD.sal.Deferred();
        NSServerTransactionLog.create({
            user_uuid: this.user_uuid,
            transaction: transaction
        })
        .then(function(obj){
            if (cb) {
                cb(null);
            }
            dfd.resolve();
        })
        .fail(function(err){
            if (cb) {
                cb(err);
            }
            dfd.reject(err);
        });
        return dfd;
    }

};
