/**
 * NSServerStepsTrans
 *
 * @module      :: Model NSServerStepsTrans
 * @description :: Translations for strings associated with NSServerSteps.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
$ = require('jquery-deferred');
var AD = require('ad-utils');

module.exports = {

    tableName: 'nextsteps_steps_trans',

    attributes: {

        step_id         : 'INTEGER',

        language_code	: 'STRING',


        step_label	: 'STRING',


        step_description	: 'STRING'

    },

/*

    // Life cycle callbacks
    afterCreate: function(newEntry, cb) {
//AD.log('<yellow><bold>Look It!!!: StepsTrans.afterUpdate() called!:</bold></yellow>');
//console.log(newEntry);

//        createTransaction(newEntry.id, 'create')
        createTransaction(newEntry.step_id, 'create')
        .then(function(){
            cb(null);
        })
        .fail(function(err){
            cb(err);
        });
    },



    afterUpdate: function(entry, cb) {
//AD.log('<yellow><bold>Look It!!!: StepsTrans.afterUpdate() called!:</bold></yellow>');
//console.log(entry);

//        createTransaction(entry.id, 'update')
        createTransaction(entry.step_id, 'update')
        .then(function(){
            cb(null);
        })
        .fail(function(err){
            cb(err);
        });
    }
*/

};



var createTransaction = function(id, operation){
    var dfd = $.Deferred();
    // Get an instance
    NSServerSteps.findOne(id)
    .then(function(step){
        // Notify all users
        step.users()
        .then(function(users){
            var numDone = 0;
            var numToDo = 0;
            users.forEach(function(user){
                DBHelper.addTransaction({
                    operation:operation,
                    model:'Steps',
                    obj:step,
                    user:user
                })
                .fail(function(err){
                    dfd.reject(err);
                })
                .then(function(){
                    numDone++;
                    if (numDone == numToDo){
                        dfd.resolve();
                    }
                });
                numToDo++;
            });
            if (numToDo == 0){
                dfd.resolve();
            }
        })
        .fail(function(err){
            dfd.reject(err);
        });
    })
    .fail(function(err){
        dfd.reject(err);
    });
    return dfd;
};
