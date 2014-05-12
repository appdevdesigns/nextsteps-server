/**
 * ADCore
 *
 * @module      :: Service
 * @description :: This is a collection of core appdev features for an application.

 *
 */
var $ = require('jquery-deferred');
var AD = require('ad-utils');


/**
 * mapModelToTransaction
 *
 * This object maps a model key (string) to the data necessary to use
 * to apply the transaction to that model:
 *
 * 'Campus': {
 *      logs: { 'operation':'console log entry to display for this operation' }
 *      table: [ModelObject],
 *      assocTable: [ModelObject that relates this Model to a User] / null if none
 *  }
 * 'CampusStep':{}
 * ...
 */
var mapModelToTransaction = {
        'Campus': {
            logs:{
                'create':'<green><bold>created:</bold></green> campus entry [campus_uuid] for user [userUUID]',
                'update':'<green><bold>updated:</bold></green> campus entry [campus_uuid] ',
                'destroy':'<green><bold>deleted:</bold></green> campus entry [campus_uuid] for user [userUUID]'
            },
            table:NSServerCampus,
            assocTable:NSServerUserCampus
        },
        'Contact': {
            logs:{
                'create':'<green><bold>created:</bold></green> contact entry [contact_uuid] for user [userUUID]',
                'update':'<green><bold>updated:</bold></green> contact entry [contact_uuid] ',
                'destroy':'<green><bold>deleted:</bold></green> contact entry [contact_uuid] for user [userUUID]'
            },
            table:NSServerContact,
            assocTable:NSServerUserContact
        },
        'ContactStep': {
            logs:{
                'create':'<green><bold>created:</bold></green> contact_step entry [contactstep_uuid] for user [userUUID]',
                'update':'<green><bold>updated:</bold></green> contact_step entry [contactstep_uuid] ',
                'destroy':'<green><bold>deleted:</bold></green> contact_step entry [contactstep_uuid] for user [userUUID]'
            },
            table:NSServerContactStep,
            assocTable:null
        },
        'ContactTag': {
            logs:{
                'create':'<green><bold>created:</bold></green> contact_tag entry [contacttag_uuid] for user [userUUID]',
                'update':'<green><bold>updated:</bold></green> contact_tag entry [contacttag_uuid] ',
                'destroy':'<green><bold>deleted:</bold></green> contact_tag entry [contacttag_uuid] for user [userUUID]'
            },
            table:NSServerContactTag,
            assocTable:null
        },
        'Group': {
            logs:{
                'create':'<green><bold>created:</bold></green> group entry [group_uuid] for user [userUUID]',
                'update':'<green><bold>updated:</bold></green> group entry [group_uuid] ',
                'destroy':'<green><bold>deleted:</bold></green> group entry [group_uuid] for user [userUUID]'
            },
            table:NSServerGroup,
            assocTable:NSServerUserGroup
        },
        'Step': {
            logs:{
                'create':'<green><bold>created:</bold></green> step entry [step_uuid] for user [userUUID]',
                'update':'<green><bold>updated:</bold></green> step entry [step_uuid] ',
                'destroy':'<green><bold>deleted:</bold></green> step entry [step_uuid] for user [userUUID]'
            },
            table:NSServerSteps,
            assocTable:NSServerUserSteps
        },
        'Tag': {
            logs:{
                'create':'<green><bold>created:</bold></green> tag entry [tag_uuid] for user [userUUID]',
                'update':'<green><bold>updated:</bold></green> tag entry [tag_uuid] ',
                'destroy':'<green><bold>deleted:</bold></green> tag entry [tag_uuid] for user [userUUID]'
            },
            table:NSServerTag,
            assocTable:NSServerUserTag
        }

};



module.exports = {


    manyThrough: function(modelA, AFilter, modelB, keyAB, keyB, filter, cb) {
        var dfd = $.Deferred();

        filter = filter || {};

        modelA.find(AFilter)
        .then(function(list){
            var ids = [];
            for (var i=0; i<list.length; i++) {
                ids.push(list[i][keyAB]);
            }

            if (ids.length == 0) {
//                console.log("modelA empty; all done");
                // None in the first filter; return an empty list
                if (cb) cb(null, []);
                dfd.resolve([]);
            } else {

                filter[keyB] = ids;
//console.log('modelB.filter:');
//console.log(filter);

                modelB.find(filter)
                .then(function(listCampuses){


//console.log('modelB list:');
//console.log(listCampuses);
//
//console.log('....');
//console.log('cb():');
//console.log(cb);

                    if (cb) cb(null, listCampuses);
                    dfd.resolve(listCampuses);

                })
                .fail(function(err){
                    if (cb) cb(err);
                    dfd.reject(err);
                });
            }
        })
        .fail(function(err){
            AD.log.error("DBHelper.manyThrough() err: ",err);
            if (cb) cb(err);
            dfd.reject(err);
        });

        return dfd;
    },



    translateList:function(list, mapObj, cb) {
        var dfd = $.Deferred();


        var numDone = 0;
        list.forEach(function(item) {


            DBHelper.getTranslation(item, function(err, trans) {

                if (err) {

                    console.log(err);
                    dfd.reject(err);
                    numDone = -1; // ensures we never hit .resolve();

                } else {
                    for (var m in mapObj) {
                        if (mapObj[m]) {
                            if (typeof trans[m] != 'undefined') {
                                item[m] = trans[m];
                            }
                        }
                    }
                    item.name = trans.name;
                }
                numDone++;
                if (numDone >= list.length) {
                    if (cb) cb(null, list);
                    dfd.resolve(list);
                }

            });
        });


        return dfd;
    },



    addTransaction: function(opts) {
        var dfd = $.Deferred();

//AD.log('addTransactions():');
//AD.log(opts);

        var operation = opts.operation;     // what operation: [create, update, destroy]

        var user = opts.user;               // the user instance
//AD.log('user:');
//AD.log(user);

        var obj = opts.obj;                 // the object instance
//AD.log('checkout the obj structure.  Can we get to the main class ?');
//console.log(obj);

        var Model = obj._Klass();            // get the Class definition for this object
//AD.log('Model:'+Model);

        var model = Model.GenModel();         // the Client model name
//AD.log('model:'+model);

        var xEntry = {};
        var ignoreFields = { id:1 };        // ignore these fields when pulling parameters

        var xactionParams = Model.getTransactionParams();


        async.series([

            // step 1: build the base xEntry object
            function(next) {
//AD.log('  - addTransaction.step 1');
                xEntry.operation = operation;
                xEntry.model = model;
                if (operation == 'destroy') {
                    xEntry.params = obj.uniqueCondition();
                } else {
                    var params =  paramsMultilingualData(Model, obj.toJSON(), ignoreFields);
                    xEntry.params = {};
                    for (var p in params) {
                        if (typeof xactionParams[p] != 'undefined') {
                            xEntry.params[p] = params[p];
                        }
                    }
                }
//AD.log('    - xEntry:', xEntry);

                next();
            },


            // step 2: add in the multilingual data as well
            function(next) {
//AD.log('  - addTransaction.step 2');

                if (operation != 'destroy') {

                    // if this is a multilingual object
                    if (DBHelper.isMultilingualTable(obj._Klass())) {
//                        obj.trans(user.default_lang)
                        DBHelper.getTranslation(obj, user.default_lang)
                        .fail(function(err){
//AD.log('obj.trans().fail():');
                            next(err);
                        })
                        .then(function(trans){
//AD.log('DBHelper.getTranslation().then():');
                            var mlParams = paramsMultilingualTrans(Model, trans, ignoreFields);
//AD.log('mlParams:', mlParams);

                            for(var p in mlParams) {
                                if (typeof xactionParams[p] != 'undefined') {
                                    xEntry.params[p] = mlParams[p];
                                }
                            }
//AD.log('xEntry:');
//AD.log(xEntry);
//AD.log();

                            next();
                        });

                    } else {
                        next();
                    }

                } else {
                    next();
                }

            },


            // step 3: now store this in the Transaction Log
            function(next) {
//AD.log('  - addTransaction.step 3');

                NSServerTransactionLog.create({
                    user_uuid: user.user_uuid,
                    transaction: xEntry
                })
                .then(function(){
                    next();
                })
                .fail(function(err){
                    next(err);
                });
            }

        ], function(err, results) {
//AD.log('  - addTransaction.final:');
            if (err) {
//AD.log.error('ERROR!');
                dfd.reject(err);
            } else {
                dfd.resolve();
            }

        });

        return dfd;
    },




    applyClientTransaction : function(userUUID, xaction) {

        var dfd = $.Deferred();


        if ( (undefined == xaction) ||
             (undefined == xaction.model) ||
             (undefined == xaction.operation) ||
             (undefined == xaction.params)) {

            var err = new Error('Attempted to apply invalid transaction from client');
            dfd.reject(err);

        } else {
//AD.log('  - checking map entry for model:'+xaction.model);

            // if this is a model we know about:
            if (mapModelToTransaction[xaction.model]) {

                var map = mapModelToTransaction[xaction.model];
//console.log(map);
                DBHelper.applyMultilingualTransaction({
                    userUUID:userUUID,
                    operation:xaction.operation,
                    params:xaction.params,
                    table:map.table,
                    assocTable:map.assocTable,
                    log:map.logs[xaction.operation]
                })
                .fail(function(err){
                    dfd.reject(err);
                })
                .then(function(){
                    dfd.resolve();
                });

            } else {

                var err = new Error('Unknown transaction model specified: '+xaction.model);
                err.xaction = xaction;

                AD.log.error(err.message);
//                console.log(err);

                // do we stop on this error? or attempt to continue?
//                dfd.reject(err);
                dfd.resolve();
            }

        } // else

        return dfd;

    }, // applyClientTransaction



    applyMultilingualTransaction : function(opts) {

        var dfd = $.Deferred();

        var userUUID = opts.userUUID;
        var operation = opts.operation;
        var params = opts.params;
        var table = opts.table;
        var userAssocTable = opts.assocTable;

        var entry = null;
        var isRestricted = false;  // indicates if this entry is restricted from update/destroy operations

        // all these operations need a user object:
        NSServerUser.findOne({user_uuid : userUUID})
        .fail(function(err) {
            AD.log.error('<bold>ERROR:</bold> .applyTransaction() could not find user entry for user_uuid:'+userUUID);
            dfd.reject(err);
        })
        .then(function(user){

            var optsLog = AD.util.string.render(opts.log, { userUUID: userUUID });

            switch(operation){

                case 'create':
//AD.log('applyMultilingualTransaction->create:');

                    async.series([

                        //// step 1: make sure current object doesn't exists
                        function(next) {
                         // TODO: check to see if entry already exists
//AD.log('step1');
                            next();
                        },


                        //// step 2.Normal Table : create entry
                        function(next) {
//AD.log('step2.Normal');
                            // if this is not a multilingual table
                            if (!DBHelper.isMultilingualTable(table)) {

                                table.create(params)
                                .fail(function(err) {
//AD.log('  table.create().fail()');
                                    next(err);
                                })
                                .then(function(newEntry) {
//AD.log('  table.create().then()');
                                    entry = newEntry;
                                    next();
                                });

                            } else {
                                next();
                            }
                        },


                        //// step 2.Multilingual Table : create entry
                        function(next) {
//AD.log('step2.Multilingual');
                            // multilingual tables declare a .getTransModel() method
                            if (DBHelper.isMultilingualTable(table)) {

                                DBHelper.multilingualCreate(table, params)
                                .fail(function(err){
                                    next(err);
                                })
                                .then(function(newEntry){
                                    entry = newEntry;
                                    next();
                                });

                            } else {
                                next();
                            }
                        },


                        //// step 3 : update user association
                        function(next) {
//AD.log('step3');
                            if (userAssocTable) {

                                // Add entry to association model
                                var ucParms = {user_uuid : userUUID };
                                ucParms[table.getFieldUUID()] = entry.uuid();
//AD.log('ucParms:');
//AD.log(ucParms);
                                userAssocTable.create(ucParms)
                                .fail(function(err) {

                                    AD.log.error('Failed to create an entry in the User Association Table.');
                                    AD.log.error('undoing creation of entry');
                                    console.log(err);


                                    // Failed to add entry to association table,
                                    // remove previous created entry

                                    // if multilingual:
                                    if (typeof table.getTransModel != 'undefined') {
                                        DBHelper.multilingualDestroy(table, {id : entry.id}, table.getFieldTransFK())
                                        .then(function(){}) // ignore return status
                                        .fail(function(err){});
                                    } else {
                                        // undo normal table:
                                        var cond = {};
                                        cond[table.getFieldUUID()] = entry.uuid();
                                        table.destroy(cond)
                                        .done(function(err){}); // done handler required
                                    }

                                    next(err);
                                })
                                .then(function(userEntry){
                                    next();
                                });

                            } else {
                                // no userAssocTable, so move along.
                                next();
                            }
                        },


                        //// step 4 : Transaction log entry for user
                        function(next) {
//AD.log('step4: adding transactionLog entry');

                            DBHelper.addTransaction({
                                operation:'create',
                                obj:entry,
                                user:user
                            })
                            .fail(function(err){

//console.log('Failed to add transaction for campus , ' + err);
                              console.trace();
                              next(err);
                            })
                            .then(function(){
                                next();
                            });
                        },


                        //// step 5 : console log message
                        function(next) {
//AD.log('step5');
                            AD.log(AD.util.string.render(optsLog, entry));
                            next();
                        }


                    ],function(err, results){

                        if (err) {
                            dfd.reject(err);
                        } else {
                            dfd.resolve();
                        }
                    });

                     break; // create


                 case 'update':
//AD.log('applyMultilingualTransaction->update:');

                    var cond = paramsCondition(table, params); //{};

                    async.series([


                        // Step 1:  compile condition
                        function(next) {
//AD.log('  step1');
//AD.log('      - cond:', cond);
                            if (cond == null) {
                             // shoot!
                                AD.log('<yellow><bold>warn:</bold><yellow> applyMultilingualTransaction()->update: given params have no id info:');
                                AD.log(params);
                                AD.log('no update happening!');
                                var err = new Error('no condition');
                                next(err);
                            } else {
                                next();
                            }

                        },


                        // step 2: PUll current entry
                        function(next) {
//AD.log('  step2');
                            table.findOne(cond)
                            .fail(function(err) {
                                next(err);
                            })
                            .then(function(currEntry){

                                if (undefined == currEntry) {
                                     // entry not found
                                     AD.log('<yellow><bold>warn:</bold></yellow> UPDATE(): could not find entry given condition:', cond);
                                     dfd.resolve();  // <-- exit without ceasing progress
                                 } else {
                                    entry = currEntry;
                                    next();
                                }
                            });

                        },


                        // step 3: Is Entry Restricted?
                        function(next) {
//AD.log('  step3:');
//AD.log('     - entry:');
//console.log(entry);

                            if (entry.userModifyRestricted) {
                                isRestricted = entry.userModifyRestricted();
//                            } else {
//                                AD.log('<yellow><bold>warn:</bold></yellow> no method .userModifyRestricted() for entry');
//                                AD.log(entry);
                            }
                            next();

                        },


                        // step 4.Normal: Update Table.
                        function(next) {
//AD.log('  step 4:Normal:');
                            // if this is not a multilingual Table
                            if (!DBHelper.isMultilingualTable(table)) {
//AD.log('    - normal.update()');
                                // if this entry is not restricted
                                if ( !isRestricted ) {

                                    /*
                                    var thisCond = entry.uniqueCondition();
                                    table.update(thisCond, params,
                                        function(err, contact){
                                            if (err){
                                                next(err);
                                            } else {
                                                next();
                                            }
                                        });
                                     */
                                    for (var p in params) {
                                        entry[p] = params[p];
                                    }
                                    entry.save(function(err) {
                                        if (err) {
                                            next(err);
                                        } else {
                                            next();
                                        }
                                    });

                                } else {

                                    AD.log('<yellow><bold>warn:</bold></yellow>Unable to update entry, permission denied');
                                    AD.log(entry);
                                    next(); // Continue processing transaction log
                                }

                            } else {
                                next();
                            }
                        },


                        // step 4.Multilingual: Update Table
                        function(next) {
//AD.log('  step4:Multilingual:');
                            // if this is a multilingual Table
                            if (DBHelper.isMultilingualTable(table)) {
//AD.log('    - multilingual.update():');
                                // if this entry is not restricted
                                if ( !isRestricted ) {

                                    DBHelper.multilingualUpdate(table, cond, params)
                                    .fail(function(err){

                                        next(err);
                                    })
                                    .then(function(results){

                                        // let's see if we can make entry look like the full
                                        // params:
                                        for (var p in params) {
                                            entry[p] = params[p];
                                        }
                                        next();
                                    });


                                } else {

                                    AD.log('<yellow><bold>warn:</bold></yellow>Unable to update entry, permission denied');
                                    AD.log(entry);
                                    next(); // Continue processing transaction log
                                }

                            } else {
                                next();
                            }
                        },


                        // Step 5: Add a transaction log for this user
                        function(next) {
//AD.log('  step5:');
                            DBHelper.addTransaction({
                                operation:'update',
                                obj:entry,
                                user:user
                            })
                            .fail(function(err){

AD.log.error('Failed to add transaction for update(), err:', err);
                              console.trace();
                              next(err);
                            })
                            .then(function(){
                                next();
                            });
                        },


                        // Step 6: display the console.log
                        function(next) {
//AD.log('  step6:');
                            AD.log(AD.util.string.render(optsLog, entry));
                            next();
                        }

                    ], function(err, results){

                        if (err) {
                            dfd.reject(err);    
                        } else {
                            dfd.resolve();
                        }
                    });

                    break; // update


                case 'destroy':
//AD.log('applyMultilingualTransaction->destroy:');

                    var cond = paramsCondition(table, params); //{};
                    if (cond == null) {
                     // shoot!
                        AD.log('<yellow><bold>warn:</bold><yellow> applyMultilingualTransaction()->destroy: given params have no id info:');
                        AD.log(params);
                        AD.log('no destroy happening!');
                        dfd.resolve();
                        return dfd;
                    }
                    table.findOne(cond)
                    .done(function(err, entry){
                    if(err) {
                        AD.log.error('<bold>ERROR:</bold> error finding entry with condition:');
                        AD.log(cond);
                        AD.log('for table:');
                        AD.log(table);
                        console.log(err);
                        dfd.reject(err);
                    } else if (undefined == entry) {
                        // entry not found
                        AD.log('<yellow><bold>warn:</bold></yellow> could not find entry given condition:',cond);
                        dfd.resolve();
                    } else {

                            // Determine if entry can be destroyed

                            if (entry.userModifyRestricted) {
                                isRestricted = entry.userModifyRestricted();
                            }
                            if ( !isRestricted ) {

                                async.series([

                                    // if there is an Association Table delete that first:
                                    function(next) {

                                        // if we have an association table:
                                        if (userAssocTable) {

                                            // Add entry to association model
                                            var ucParms = {user_uuid : userUUID };
                                            ucParms[table.getFieldUUID()] = entry.uuid();
                                            // alternatively: ucParms[table.getFieldUUID()] = params[table.getFieldUUID()];

                                            AD.log('  - about to delete association entry');
                                            userAssocTable.destroy(ucParms)
                                            .done(function(err){
                                                if (err) {
                                                    next(err);
                                                } else {
                                                    next();
                                                }
                                            });

                                        } else {

                                            // no?  just move along then.
                                            next();
                                        }

                                    },


                                    // Normal Table: Now delete the actual entry
                                    function(next) {

                                        // if this is a normal table
                                        if (!DBHelper.isMultilingualTable(table)) {
//                                             AD.log('  - about to delete entry');

                                            table.destroy(cond)
                                            .fail(function(err){
                                                AD.log.error('<bold>Error:</bold> destroying entry failed!', cond, err);
                                                console.log(err);
                                                next(err);
                                            })
                                            .then(function(){

                                                // did it!
                                                AD.log(AD.util.string.render(optsLog, entry));
                                                next();
                                            });

                                        } else {
                                            next();
                                        }

                                    },


                                    // Multilingual Table: Now delete the actual entry
                                    function(next) {

                                        // if this is a multilingual table
                                        // multilingual tables have a .getTransModel()
                                        if ( DBHelper.isMultilingualTable(table) ) {

                                            AD.log('  - about to delete entry');
                                            DBHelper.multilingualDestroy(table, cond, table.getFieldTransFK())
                                            .fail(function(err){
                                                AD.log.error('<bold>Error:</bold> destroying multilingual entry failed:', cond, err);
                                                console.log(err);
                                                next(err);
                                            })
                                            .then(function(){

                                                // did it!
                                                AD.log(AD.util.string.render(optsLog, entry));
                                                next();

                                            });
                                        } else {
                                            next();
                                        }

                                    },


                                    // ok, now make an entry in the transaction log for the user
                                    function(next) {

                                        DBHelper.addTransaction({
                                            operation:'destroy',
                                            obj:entry,
                                            user:user
                                        })
                                        .fail(function(err){
                                            next(err);
                                        })
                                        .then(function(){
                                            next();
                                        });

                                    }
                                    ], function(err, results) {

                                        if (err) {

                                            AD.log.error('<bold>ERROR:</bold> problem processing this delete transaction');
                                            AD.log(params);
                                            dfd.reject(err);

                                        } else {

                                            AD.log('  - destroy transaction completed.');
                                            dfd.resolve();
                                        }
                                    });


                            } else {  // isRestricted

                                AD.log('<yellow><bold>warn:</bold></yellow> Failed to delete entry: permission denied');
                                AD.log(entry);
                                dfd.resolve(); // Continue processing transaction log
                            }

                        }  // if valid entry

                    });  // table.findOne().done();
                    break; // destroy

                default: // unrecognized operation
                    var text = 'Unrecognized operation ['+operation+'] in client transaction for model';
                    AD.log.error('<bold>ERROR:</bold>'+text);
                    var err = new Error(text);
                    dfd.reject(err);
                    break; // default
            } // switch


        });    // NSUser.findOne()

        return dfd;

    }, // applyMultilingualTransaction



    /**
    * @function isMultilingualTable
    *
    * Function to create an entry in the primary and translation tables for a model.
    *
    * @param {object} table - the model definition of the data table
    * @return {bool} true if a multilingual table, false otherwise
    */
    isMultilingualTable: function(table) {

        return (undefined != table.getTransModel);
    },



     /**
      * Function to create an entry in the primary and translation tables for a model.
      * @param model - model definition for primary table, e.g. NSServerCampus
      * @param params - parameters for new entry (JSON object)
      * @return jquery deferred object
      */
     multilingualCreate : function(model, params) {

         var dfd = $.Deferred();

         var modelTrans = null;
         if ( DBHelper.isMultilingualTable(model) ) {
             modelTrans = model.getTransModel();
         };

         var someParms = paramsMultilingualData(model, params); //{};
//         for (key in model.attributes) {
//             someParms[key] = params[key];
//         }
//AD.log('multilingualCreate: model.create()');
//AD.log('someParms:');
//AD.log(someParms);

         model.create(someParms)
         .done(function(err, entry){
             if (!err) {
                 if (! modelTrans) {

                     AD.log('<yellow><bold>warn:</bold></yellow> no getTransModel() found on model');
                     console.log(model);
                     // No translation model, we're done
                     dfd.resolve(entry); // Return entry

                 } else {
                     // Gather translation parameters and create entry in translation model
                     var transParms = paramsMultilingualTrans(model, params); //{};

                     //entry.addTranslation(transParms)
                     DBHelper.addTranslation(entry, transParms)
                     .then(function(){
//AD.log('    - entry.addTranslation().then()');
                         dfd.resolve(entry); // Return entry

                     })
                     .fail(function(err){
//AD.log('    - entry.addTranslation().fail()');
                         // Failed to create entry in translation model
                         // Need to destroy entry in primary model, ignore return value
                         model.destroy({id : entry.id})
                         .done(function(err) {}); // .done required
                         dfd.reject(err);
                     });

                  }
             } else {
                 dfd.reject(err);
             }
          });

         return dfd;
     },



     /**
      * Function to destroy an entry in the primary table and all entries in the associated
      * translation table for a model.
      * @param model - model definition for primary table, e.g. NSServerCampus
      * @param params - parameters used to identify entry in primary table (JSON object)
      * @param field - field name used to associate the translation table to primary table.
      * @return jquery deferred object
      */
     // TODO: refactor this so we don't need the field parameter
     multilingualDestroy : function(model, params, field){

         var dfd = $.Deferred();

         var modelTrans = null;
         if ( DBHelper.isMultilingualTable(model) ) {
             modelTrans = model.getTransModel();
         };

         model.findOne(params)
         .done(function(err, entry){
             if (!err) {
                 var criteria = {};
                 criteria[field] = entry.id;
                 if(modelTrans) {
                     modelTrans.destroy(criteria)
                     .done(function(err){}); // ignore return status
                 }
                 model.destroy(params)
                 .done(function(err){
                     dfd.resolve(); // ignore return status
                 });

             } else {
                 // Entry couldn't be found, equivalent to destroy so we call dfd.resolve()
                 dfd.resolve();
             }
         });

         return dfd;

     },



     /**
      * @function multilingualUpdate
      *
      * Perform an update operation on a multilingual Model.
      *
      * @param {object} model : the Model definition of the Data model
      * @param {object} condition : the condition of the entry to update
      * @param {object} params : the key:value hash of the new values
      * @return {Deferred}
      */
     multilingualUpdate: function (model, condition, params) {
         var dfd = $.Deferred();
//AD.log('   DBHelper.multilingualUpdate()');
//AD.log('      cond:', condition);
//AD.log('      params:', params);

         // verify a language_code was provided:
         if (params.language_code) {

             var entry = null;
             var dataCondition = paramsMultilingualData(model, condition, {language_code:1});

             async.series([

                 // step 1: get the current entry in the Data Table
                 function(next) {

//AD.log('      dataCondition:', dataCondition);
//console.log(dataCondition);

                     model.findOne(dataCondition)
                     .fail(function(err){
                         AD.log.error('<bold>Error:</bold> finding multilingual data:()');
                         AD.log('mode:'+model.GenModel());
                         AD.log('dataCondition:', dataCondition);
                         console.log(err);
                         next(err);
                     })
                     .then(function(theEntry){
                         entry = theEntry;
                         next();
                     });

                 },


                 // step 2: now perform the update(s)
                 function(next) {

                     if (entry) {

                         var cond = entry.uniqueCondition();

                         async.parallel([

                             function(done) {

                                 // update the Data table
                                 var dataValues = paramsMultilingualData(model, params, cond);

                                 if (!AD.util.obj.isEmpty(dataValues)) {
                                     model.update(cond, dataValues)
                                     .done(function(err,results){

                                         done(err);
                                     });
                                 } else {
                                     done();
                                 }
                             },

                             function(done) {
                                 // update the multilingual table
                                 var transValues = paramsMultilingualTrans(model, params);
                                 var transCondition = { language_code : params.language_code };
                                 transCondition[model.getFieldTransFK()] = entry.id;
                                 if (!AD.util.obj.isEmpty(transValues)) {
                                     model.getTransModel().update(transCondition, transValues)
                                     .done(function(err, results) {
                                         done(err, results);
                                     });
                                 } else {
                                     done();
                                 }
                             }

                         ], function(err, results) {

                             if (err) {
                                 AD.log.error('<bold>Error:</bold> performing multilingualUpdate(): ');
                                 AD.log(err);
                                 next(err);
                             } else {

                                 next();
                             }
                         });

                     } else {

                         // no entry found, so no update!
                         AD.log('<yellow><bold>warn:</bold> no existing entry found for multilingual Table:');
                         AD.log('   <yellow>model:</yellow> '+ model.GenModel());
                         AD.log('   <yellow>cond:</yellow>', dataCondition);
                         AD.log();

                         // this is not necessarily an error.
                         next();
                     }
                 }

             ], function(err, results) {
                 if (err) {
                     dfd.reject(err);

                 } else {
                     dfd.resolve();
                 }
             });


         } else {

             var text = 'DBHelper.multilingualUpdate()  called with no language_code set.';
             AD.log.error('<bold>Error!</bold> '+ text);
             AD.log('params:', params);
             var err = new Error(text);
             err.params = params;
             dfd.reject(err);
         }

         return dfd;
     },



     /**
      * @function addTranslation
      *
      * Add a translation to the provided object.
      *
      * @param {object} obj the instance of a multilingual object to add a translation entry to.
      * @param {object} transEntry  a hash of translation values to add to the object.
      *                 NOTE: should include a language_code:'xx'
      * @param {function} [optional] callback function to call when operation complete.
      * @returns {Deferred}  No data is passed back on success.
      */
     addTranslation: function(obj, transEntry, cb) {
//AD.log('DBHelper.addTranslation()');

         var dfd = $.Deferred();
         transEntry[obj._Klass().getFieldTransFK()] = obj.id;
         obj._Klass().getTransModel().create(transEntry)
         .fail(function(err){
//AD.log('DBHelper.addTranslation()->fail()');
              if (cb) {
                  cb(err);
              }
              dfd.reject(err);
          })
         .then(function(obj){
//AD.log('DBHelper.addTranslation()->then()');
             if (cb) {
                 cb(null);
             }
             dfd.resolve();
         });
         return dfd;
     },



     /**
      * @function getTranslation
      *
      * Return the translation values based upon the provided language code.
      *
      * On a successful operation, obj.translations = {
      * //        'lang_code': { translation entry {
      *         'en' : { label:'english label', language_code:'en' }
      *         ...
      *     }
      *
      * @param {object} obj the instance of a multilingual object to get a
      *                     translation entry from.
      * @param {string} lang  the language_code value of the translation data
      *                     we are retrieving.
      * @param {function} [optional] callback function to call when operation complete.
      * @returns {Deferred}  On success the first matching translation entry
      *                      be returned.
      */
     getTranslation:function(obj, lang, cb) {
         // find the translations for this entry.
         // the translations will be stored in a this.translations {} object
         // trans('en', function(err, list) {})
         //
//AD.log('DBHelper.getTranslation()');
//console.trace();

         var dfd = $.Deferred();


         var param = {language_code:lang};
         var fkField = obj._Klass().getFieldTransFK();
         param[fkField] = obj.id;
//AD.log('    param:', param);

         obj._Klass().getTransModel().find(param)
         .fail(function(err){
             if (cb) cb(err);
             dfd.reject(err);
         })
         .then(function(listTrans){
//AD.log('listTrans:', listTrans);

             var thisTrans = {};
             for (var lt=0; lt<listTrans.length; lt++) {
                 thisTrans[listTrans[lt].language_code] = listTrans[lt];
             }

             obj.translations = thisTrans;
//AD.log('thisTrans:',thisTrans);

             if (cb) cb(null, listTrans[0]);
             dfd.resolve(listTrans[0]);
         });

         return dfd;
     }

};




var paramsMultilingualData = function(model, params, ignore) {

    ignore = ignore || {};

    var someParms = {};
    for (key in model.attributes) {

        // if this key isn't in the ignore list add it
        if (typeof ignore[key] == 'undefined') {
            if (typeof params[key] != 'undefined') {
                someParms[key] = params[key];
            }
        }

    }

    return someParms;
};




var paramsMultilingualTrans = function(model, params, ignore) {

    ignore = ignore || {};

    var transParms = {};

    if (typeof params == 'undefined') {
        AD.log('<yellow><bold>warn:</bold> paramsMultilingualTrans() called with no params');
        return transParms;
    }

    var modelTrans = null;
    if ( DBHelper.isMultilingualTable(model)) {
        modelTrans = model.getTransModel();
    };


    if (modelTrans) {
//AD.log('paramsMultilingualTrans() : scanning attributes:');
//AD.log('params:');
//console.log(params);
//AD.log('ignore:', ignore);

        for (key in modelTrans.attributes) {
//AD.log('key:', key);
            // if key is not in ignore list
            if ('undefined' == typeof ignore[key]) {
//AD.log('   ignoreKey passed.');

                if ('undefined' != typeof params[key]) {
//AD.log('   params[key] passed:');

                    transParms[key] = params[key];
                }
            }
        }

    } else {
        AD.log('<yellow><bold>warn:</bold> no translation table found for model.</yellow>');
        console.log(model);
    }
//AD.log('transParms:', transParms);
    return transParms;

};


/**
 * @function paramsCondition
 *
 * Return a condition object based upon the parameters provided.
 *
 * We start by first using the table.uuid field.  If that isn't
 * provided, then we use the id field.
 *
 * if neither of those are provided in the params, then we return
 * null.
 *
 * @return {object/null}
 */
var paramsCondition = function(table, params) {
    var cond = {};
    var fieldUUID = table.getFieldUUID();
    if (params[fieldUUID]) {
        cond[fieldUUID] = params[fieldUUID];
    } else {

        // what?
        // let's try for id:
        if (params.id) {


            cond.id = params.id;
        } else {

            // shoot!

            return null;
        }
    }

    return cond;
};


//// LEFT OFF:
//// - figure out unit tests for testing the controller output.