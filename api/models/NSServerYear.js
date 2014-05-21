/**
 * NSServerYear
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var AD = require('ad-utils');

module.exports = {

    connection: ['nextStepsServer'],

    tableName : 'nextsteps_year',

    attributes: {
        
        year_id	: 'INT',
        
        addTranslation: function(transEntry, cb) {
            var dfd = AD.sal.Deferred();
            transEntry.step_id = this.id;
            NSServerYearTrans.create(transEntry)
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
        }, // addTranslation

        trans:function(lang, cb) {
            // find the translations for this entry.
            // the translations will be stored in a this.translations {} object
            // trans('en', function(err, list) {})
            //

            var self = this;
            if (typeof cb == 'undefined') {
                cb = lang;
                lang = 'en';
            }

            NSServerYearTrans.find({step_id:this.id,language_code:lang})
            .then(function(listTrans){
                var thisTrans = {};
                for (var lt=0; lt<listTrans.length; lt++) {
                    thisTrans[listTrans[lt].language_code] = listTrans[lt];
                }
                self.translations = thisTrans;
                cb(null, listTrans[0]);
            })
            .fail(function(err){
                cb(err);
            });
        } // trans
            
    } // attributes

};
