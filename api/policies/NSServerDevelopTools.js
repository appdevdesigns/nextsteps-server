/**
 * Develop Tools
 *
 * @module      :: Policy
 * @description :: Attempting to consolodate any of our Testing routines to
 *                 this step.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
var $ = require('jquery-deferred');
var AD = require('ad-utils');

module.exports = function(req, res, next) {

    if (sails.config.environment == 'production') {
        next();
    } else {

        AD.log();
        AD.log();
        AD.log('<green><bold>DEVELOP TOOLS() ...</bold></green>');

        // now populate initial testing data from the Test System:
        NSServerSystem_Test.validateUser(req, res)
        .fail(function(err){
            // now this is weird!
            next(err);
        })
        .then(function(){
AD.log('  develop tools() next()');
            next();
        });

    }

};


