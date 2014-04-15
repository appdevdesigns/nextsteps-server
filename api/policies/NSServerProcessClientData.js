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


    AD.log('<green><bold>process client data ...</bold></green>');

    AD.log('typeof transactionLog: '+ typeof req.param('transactionLog'));

    // if there is no transaction log, then continue on
    if (typeof req.param('transactionLog') == 'undefined') {

        AD.log('  - <yellow><bold>no transaction log.</bold></yellow>');
        next();
        return;
    }

    AD.log('  - got some transaction logs:');

    // let's process this thing
    var log = AD.util.clone(req.param('transactionLog'));
    AD.log(log);
    var userUUID = req.appdev.userUUID;
    processLog(log, userUUID, res, next);

};



// Recursive transaction log processing function
// We need to do this so that each transaction completes before processing the next.
var processLog = function(log, userUUID, res, next){
//AD.log('    - in processLog():');
    if (0 == log.length) {

        AD.log('all done! ');
        next();

    } else {

        var xAction = log.shift();
//AD.log('    - xAction:');
//console.log(xAction);

        if ( (undefined == xAction) ||
                (undefined == xAction.model) ||
                (undefined == xAction.operation) ||
                (undefined == xAction.params)) {

            var err = new Error('Attempted to apply invalid transaction from client');
            ADCore.comm.error(res, err);
            return;
        }
//AD.log('    - calling applyClientTransaction()');
        DBHelper.applyClientTransaction(userUUID, xAction)
        .fail(function(err){
            // TODO: rollback ?
            // respond with an error
            ADCore.comm.error(res, err);
        })
        .then(function(data){

            processLog(log, userUUID, res, next);

        });

    }
};



