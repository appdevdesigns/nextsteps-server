/**
 * NSServerSteps
 *
 * @module      :: Model NSServerSteps
 * @description :: List of known steps. The measurement_id field corresponds to the GMA measurement id.
 *                 See also NSServerStepsTrans for translation strings related to this model.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var AD = require('ad-utils');
var $ = require('jquery-deferred');

module.exports = {

    connection: ['nextStepsServer'],

    tableName: 'nextsteps_steps',

    attributes: {

         "step_uuid"	: 'STRING',

         campus_uuid   : 'STRING',

         measurement_id	: 'INTEGER',

         // Is the user restricted from modifying this entry?
         userModifyRestricted: function() {
             // Not allowed if this is a "GMA" node
             return ((this.measurement_id != 0) && (this.measurement_id != null));
         },

         // Generate transaction entry
         transaction: function(operation, lang, cb) {
             var dfd = AD.sal.Deferred();
/*
             var xEntry = {  'operation': operation,
                             'model': 'Step',
                             'params': {
                                 'step_uuid': this.step_uuid,
                                 'campus_uuid': this.campus_uuid
                             } };
             if (operation != "destroy") {
                 // Look up the translation
                 this.trans(lang, function(err, transEntry){
                     if (err) {
                         if (cb) {
                             cb(err);
                         }
                         dfd.reject(err);
                     } else {
                         xEntry.params.step_label = transEntry.step_label;
                         xEntry.params.step_description = transEntry.step_description;
                         if (cb) {
                             cb(xEntry);
                         }
                         dfd.resolve(xEntry);
                     }
                 });
             } else {
                 // Nothing more to do
                 dfd.resolve(xEntry);
             }
*/
             AD.log.error('<bold>WHOAH!:</bold> Hey someone called NSServerSteps.transaction()');
             console.trace();
             dfd.reject(new Error('shouldnt use this.'));
             return dfd;
         },



/*
         addTranslation: function(transEntry, cb) {
             var dfd = $.Deferred();

             transEntry.step_id = this.id;
             NSServerStepsTrans.create(transEntry)
             .fail(function(err){
                 if (cb) {
                     cb(err);
                 }
                 dfd.reject(err);
             })
             .then(function(obj){
                 if (cb) {
                     cb(null);
                 }
                 dfd.resolve();
             });

             return dfd;
         },



         trans:function(lang, cb) {
             // find the translations for this entry.
             // the translations will be stored in a this.translations {} object
             // trans('en', function(err, list) {})
             //
             var dfd = $.Deferred();

             var self = this;
//             if (typeof cb == 'undefined') {
//                 cb = lang;
//                 lang = 'en';
//             }
             NSServerStepsTrans.find({step_id:this.id,language_code:lang})
             .then(function(listTrans){
                 var thisTrans = {};
                 for (var lt=0; lt<listTrans.length; lt++) {
                     thisTrans[listTrans[lt].language_code] = listTrans[lt];
                 }
                 self.translations = thisTrans;
                 if (cb) cb(null, listTrans[0]);
                 dfd.resolve(listTrans[0]);
             })
             .fail(function(err){
                 if (cb) cb(err);
                 dfd.reject(err);
             });

             return dfd;
         },
*/

         campus: function(cb) {
             var dfd = AD.sal.Deferred();
             if (!this.isPersonal()) {
                 NSServerCampus.findOne({
                     campus_uuid: this.campus_uuid
                 })
                 .then(function(campus) {
                     if (cb) {
                         cb(null, campus);
                     }
                     dfd.resolve(campus);
                 })
                 .fail(function(err){
                     if (cb) {
                         cb(err);
                     }
                     dfd.reject(err);
                 });
             } else {
                 dfd.reject("This is a custom step");
             }

             return dfd;
         },

         isPersonal: function() {
             return (this.campus_uuid == null);
         },

         // Get list of user objects associated with this step
         // Handles both personal steps and campus steps
         users: function(cb) {
             var dfd = AD.sal.Deferred();

             var userListDfd = AD.sal.Deferred();
             if (this.isPersonal()) {
                 // A Personal step; get the user UUIDs
                 userListDfd = getPersonalStepUsers(this);
             } else {
                 // A campus step; get the campus users
                 userListDfd = getCampusStepUsers(this);
             }

             $.when(userListDfd)
             .then(function(users){
                 // All done
                 if (cb) {
                     cb(null, users);
                 }
                 dfd.resolve(users);
             })
             .fail(function(err){
                 if (cb) {
                     cb(err);
                 }
                 dfd.reject(err);
             });

             return dfd;
         },



         /**
          * @function uniqueCondition
          *
          * Return an object representing the unique condition for this
          * entry.  Not simply { id:x } but rather using the uuid and
          * if needed (by joining tables) other fields as well.
          *
          * @returns {String}
          */
         uniqueCondition: function() {
             return {
                 'step_uuid': this.step_uuid,
                 'campus_uuid': this.campus_uuid
             };
         },



         /**
          * @function uuid
          *
          * Return the current campus_uuid value.
          *
          * @returns {String}
          */
         uuid: function() {
             return this.step_uuid;
         },



         /**
          * @function _Klass
          *
          * Return the Class for this object.
          *
          * @returns {String}
          */
         _Klass: function() {
             return NSServerSteps;
         }

    }, // attributes



    /**
     * @function GenModel
     *
     * Return the name of the Generic Model Reference for this object.
     *
     * This is the model reference that the mobile client will understand.
     *
     *
     * @returns {String}
     */
    GenModel: function() {
        return 'Step';
    },



    /*
     * @return model for translation table
     */
    getTransModel : function() {
        return NSServerStepsTrans;
    },



    /**
     * @function getFieldTransFK
     * return the field used as the foreignKey in the Translation table.
     * @return {string}
     */
    getFieldTransFK:function() {
        return 'step_id';
    },



    /**
     * @function getFieldUUID
     * Useful for generic routines to know how to link to this table.
     * @return {string}
     */
    getFieldUUID:function() {
        return 'step_uuid';
    },



    /**
     * @function getTransactionParams
     * Return an object that contains the fields to store in the transaction log params.
     * @return {object}
     */
    getTransactionParams:function() {
        return {
            step_uuid:1,
            campus_uuid:1,
            step_label:1,
            step_description:1
       };
    },

    // Life cycle callbacks
//    afterCreate: function(newEntry, cb) {
//        createTransaction(newEntry.id, 'create')
//        .then(function(){
//            cb(null);
//        })
//        .fail(function(err){
//            cb(err);
//        });
//    },
//
//    afterUpdate: function(entry, cb) {
//        createTransaction(entry.id, 'update')
//        .then(function(){
//            cb(null);
//        })
//        .fail(function(err){
//            cb(err);
//        });
//    }
};

var getPersonalStepUsers = function(step) {
    var dfd = $.Deferred();
    // A Personal step; get the user UUIDs
    NSServerUserSteps.find({
        step_UUID: step.UUID
    })
    .then(function(userSteps) {
        // Now get the user objects
        var userObjs = [];
        var numDone = 0;
        var numToDo = 0;
        userSteps.forEach(function(userStep){
            userStep.user()
            .then(function(user){
                userObjs.push(user);
                numDone++;
                if (numDone == numToDo){
                    // All done
                    dfd.resolve(userObjs);
                }
            })
            .fail(function(err){
                dfd.reject(err);
            });
            numToDo++;
        });
        if (numToDo == 0){
            cb(null);
        }
    })
    .fail(function(err){
        dfd.reject(err);
    });
    return dfd;
};

var getCampusStepUsers = function(step) {
    var dfd = $.Deferred();
    // A campus step; get the campus object
    step.campus()
    .then(function(campus){
        // Now get the user objects
        campus.users()
        .then(function(userObjs){
            dfd.resolve(userObjs);
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
