/**
 * NSServerCampus
 *
 * @module      :: Model NSServerCampus
 * @description :: A list of known campuses. The node_id field represents the GMA node id.
 *                 See also NSServerCampusTrans for translation strings associated with campuses.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */
var $ = require('jquery-deferred');
var AD = require('ad-utils');

module.exports = {

  connection: ['nextStepsServer'],

  tableName: 'nextsteps_campus',

  attributes: {

    /* e.g.
    nickname: 'string'
    */

    campus_uuid : 'STRING',


    node_id : 'INTEGER',

    // Is the user restricted from modifying this entry?
    userModifyRestricted: function() {
        // Not allowed if this is a "GMA" node
        return ((this.node_id != 0) && (this.node_id != null));
    },


    // Generate transaction entry
    transaction: function(operation, lang, cb) {
        var dfd = $.Deferred();
/*
        var xEntry = {  'operation': operation,
                        'model': 'Campus',
                        'params': {
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
                    xEntry.params.campus_label = transEntry.campus_label;
//                    xEntry.params.long_name = transEntry.long_name;
                    if (cb) {
                        cb(xEntry);
                    }
                    dfd.resolve(xEntry);
                }
            });
        } else { // is destroy operation
            if (cb) {
                cb(xEntry);
            }
            dfd.resolve(xEntry);
        }

*/
        AD.log.error('<bold>WHOAH!:</bold> Hey someone called NSServerSteps.transaction()');
        console.trace();
        dfd.reject(new Error('shouldnt use this.'));
        return dfd;
    }, // transaction


/*
    addTranslation: function(transEntry, cb) {
        var dfd = $.Deferred();
        transEntry.campus_id = this.id;
//AD.log('    - NSServerCampus.addTranslation():');
//AD.log(transEntry);

        NSServerCampusTrans.create(transEntry)
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

        var dfd = $.Deferred();

        var self = this;
//        if (typeof cb == 'undefined') {
//            cb = lang;
//            lang = 'en';
//        }
//console.log();
//console.log('.trans():');
//console.log(this);
//console.log(lang);

        NSServerCampusTrans.find({campus_id:this.id,language_code:lang})
        .then(function(listTrans){
            var thisTrans = {};
            for (var lt=0; lt<listTrans.length; lt++) {
                thisTrans[listTrans[lt].language_code] = listTrans[lt];
            }
            self.translations = thisTrans;
//console.log('   --> returning:');
//console.log(listTrans[0]);
//console.log();

            if (cb) cb(null, listTrans[0]);
            dfd.resolve(listTrans[0]);
        })
        .fail(function(err){
            if (cb) cb(err);
            dfd.reject(err);
        });

        return dfd;
    }, // trans

*/

    users: function(filter, cb) {
        var dfd = $.Deferred();

        if (typeof cb == 'undefined') {
            if (typeof filter == 'function') {
                cb = filter;
                filter = {};
            }
        }

        filter = filter || {};
        DBHelper.manyThrough(NSServerUserCampus, {campus_uuid:this.campus_uuid}, NSServerUser, 'user_uuid', 'user_uuid', filter)
        .then(function(listUsers) {
            if (cb) {
                cb(null, listUsers);
            }
            dfd.resolve(listUsers);
        })
        .fail(function(err){
            if (cb) {
                cb(err);
            }
            dfd.reject(err);
        });
        return dfd;
    }, // users



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
        return this.campus_uuid;
    },



    /**
     * @function _Klass
     *
     * Return the Class for this object.
     *
     * @returns {String}
     */
    _Klass: function() {
        return NSServerCampus;
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
      return 'Campus';
  },



  /**
   * @function getTransModel
   * Return the Model that handles the translations for this table.
   * @return model for translation table
   */
  getTransModel : function() {
      return NSServerCampusTrans;
  },



  /**
   * @function getFieldTransFK
   * return the field used as the foreignKey in the Translation table.
   * @return {string}
   */
  getFieldTransFK:function() {
      return 'campus_id';
  },



  /**
   * @function getFieldUUID
   * Useful for generic routines to know how to link to this table.
   * @return {string}
   */
  getFieldUUID:function() {
      return 'campus_uuid';
  },



  /**
   * @function getTransactionParams
   * Return an object that contains the fields to store in the transaction log params.
   * @return {object}
   */
  getTransactionParams:function() {
      return {
          campus_uuid:1,
          campus_label:1,
//          long_name:1
     };
  },




/*

  // Life cycle callbacks
  afterCreate: function(newEntry, cb) {
      // Nothing to do.  No users if we're just now creating a node
      cb();
  },


//// TODO: create DBHelper.alertUsersOfUpdate(NSServerCampus, entry.id, 'Campus');
  afterUpdate: function(entry, cb) {
  AD.log('NSServerCampus.afterUpdate():');
      NSServerCampus.findOne(entry.id)
      .fail(function(err){
          cb(err);
      })
      .then(function(campus){
          // Notify all users
          campus.users()
          .fail(function(err){
              cb(err);
          })
          .then(function(users){
              var numDone = 0;
              var numToDo = 0;
              users.forEach(function(user){
                  DBHelper.addTransaction({
                      operation:'update',
                      model:'Campus',
                      obj:campus,
                      user:user
                  })
                  .fail(function(err){
                      cb(err);
                  })
                  .then(function(){
                      numDone++;
                      if (numDone == numToDo){
                          cb(null);
                      }
                  });
                  numToDo++;
              });
              if (numToDo == 0){
                  cb(null);
              }
          });
      });
  }
*/

};
