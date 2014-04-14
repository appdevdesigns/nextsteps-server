/**
 * Process Client Data
 *
 * @module      :: Policy
 * @description :: We are given a series of transaction logs to process from the client
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
var AD = require('ad-utils');

module.exports = function(req, res, next) {


//console.log('*** skipping processClientData() ***');
//////WARNING: This is only for testing
//next();
//return;


    AD.log('<green><bold>process client data ...</bold></green>');


    var log = AD.util.clone(req.param('transactionLog'));
    if (undefined == log) {
        //no transaction log
        console.log('No client transactions');
        next();
        return;
    }

     var userUUID = req.appdev.userUUID;

     processLog(log, userUUID, res, next);

};

// Recursive transaction log processing function
// We need to do this so that each transaction completes before processing the next.
// TODO: Refactor this to be non-recursive
var processLog = function(log, userUUID, res, next){

    var xAction = log.shift();
    if ( (undefined == xAction) ||
            (undefined == xAction.model) ||
            (undefined == xAction.operation) ||
            (undefined == xAction.params)) {

        var err = new Error('Attempted to apply invalid transaction from client');
        ADCore.comm.error(res, err);
        return;
    }

    DBHelper.applyClientTransaction(userUUID, xAction)
    .fail(function(err){
        // TODO: rollback ?
        // respond with an error
        ADCore.comm.error(res, err);
    })
    .then(function(data){
//AD.log('   processLog().then();  log.length['+log.length+']');
        if (0 == log.length) { // We're done, signal next policy
            next();
        } else { // recurse with next transaction
            processLog(log, userUUID, res, next);
        }
    });
};



