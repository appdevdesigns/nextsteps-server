/**
 * NSServerUserSteps
 *
 * @module      :: Model NSServerUserSteps
 * @description :: Association model to correlate users and custom (user created) steps. Steps stored in GMA are not included
 *                 in this model.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var $ = require('jquery-deferred');

module.exports = {

	connection: ['nextStepsServer'],

    tableName: 'nextsteps_user_steps',

    attributes: {


        user_uuid	: 'STRING',


        step_uuid	: 'STRING'
    },

//    // Returns a user object related to this instance
//    user: function(cb) {
//        var dfd = $.Deferred();
//        NSServerUser.findOne({
//            user_uuid: this.user_uuid
//        })
//        .then(function(user) {
//            if (cb) {
//                cb(null, user);
//            }
//            dfd.resolve(user);
//        })
//        .fail(function(err){
//            if (cb) {
//                cb(err);
//            }
//            dfd.reject(err);
//        });
//
//        return dfd;
//    }

};
