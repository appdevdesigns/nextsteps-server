/**
 * ValidateUser
 *
 * @module      :: Policy
 * @description :: Add a new user if necessary and retrieve the user's UUID.
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
var $ = require('jquery-deferred');
var AD = require('ad-utils');

var testClientData = {
        'username' : 'jon@vellacott.co.uk',
        'password' : 'manila',
        'lastSyncTimestamp': '',
        'appVersion': '0.0.1',
        'transactionLog': [
//                           {
//                               'operation': 'create',
//                               'model': 'Campus',
//                               'params': {
//                                   'campus_uuid'      : '01234567890abcdef',
//                                   'node_id'           : '0',
//                                   'language_code'     : 'en',
//                                   'campus_label'      : 'USU'
//                                }
//                           },
//                           {
//                               'operation': 'create',
//                               'model': 'Campus',
//                               'params': {
//                                   'campus_uuid'      : '34567890abcdef012',
//                                   'node_id'           : '0',
//                                   'language_code'     : 'en',
//                                   'campus_label'      : 'UofU'
//                                }
//                           },
//                           {
//                               'operation': 'create',
//                               'model': 'Campus',
//                               'params': {
//                                   'campus_uuid'      : 'abcdef01234567890',
//                                   'node_id'           : '0',
//                                   'language_code'     : 'en',
//                                   'campus_label'      : 'MSU'
//                                }
//                           },
//                           {
//                               'operation': 'update',
//                               'model': 'Campus',
//                               'params': {
//                                   'campus_uuid'      : '34567890abcdef012',
//                                   'node_id'           : '0',
//                                   'language_code'     : 'en',
//                                   'campus_label'      : 'XSU',
//                                   'long_name'         : 'Xavier State University'
//                                }
//                           },
//                           {
//                               'operation': 'destroy',
//                               'model': 'Campus',
//                               'params': {
//                                   'campus_uuid'      : 'abcdef01234567890'
//                                }
//                           },

       {
           'operation': 'create',
           'model': 'Contact',
           'params': {
               'contact_uuid'      : '01234567890abcdef',
               'contact_firstname' : 'Samuel',
               'contact_lastname'  : 'Smith',
               'contact_nickname'  : 'Sam',
               'campus_uuid'       : 'mycampusuuid',
               'year_id'           : '1',
               'contact_phone'     : '123-456-7890',
               'contact_email'     : 'sam.smith@gmail.com',
               'contact_notes'     : 'blond hair'
           }
        },
        {
            'operation': 'create',
            'model': 'Contact',
            'params': {
                'contact_uuid'      : '234567890abcdef01',
                'contact_firstname' : 'Susan',
                'contact_lastname'  : 'Smith',
                'contact_nickname'  : 'Sue',
                'campus_uuid'       : 'mycampusuuid',
                'year_id'           : '1',
                'contact_phone'     : '123-456-7890',
                'contact_email'     : 'susan.smith@gmail.com',
                'contact_notes'     : 'wife of Sam'
            }
        },
        {
            'operation': 'create',
            'model': 'Contact',
            'params': {
                'contact_uuid'      : '234567890abcdefxx',
                'contact_firstname' : 'Jason',
                'contact_lastname'  : 'Smith',
                'contact_nickname'  : '',
                'campus_uuid'       : 'anothercampusuuid',
                'year_id'           : '3',
                'contact_phone'     : '123-456-7890',
                'contact_email'     : 'jason.smith@gmail.com',
                'contact_notes'     : ''
            }
        },
        {
            'operation': 'update',
            'model': 'Contact',
            'params': {
                'contact_uuid'      : '234567890abcdef01',
                'contact_firstname' : 'Susan',
                'contact_lastname'  : 'Smith',
                'contact_nickname'  : 'Susie',
                'campus_uuid'       : 'mycampusuuid',
                'year_id'           : '2',
                'contact_phone'     : '123-456-7890',
                'contact_email'     : 'susan.smith@gmail.com',
                'contact_notes'     : 'wife of Sam'
            }
        },
        {
            'operation': 'destroy',
            'model': 'Contact',
            'params': {
                'contact_uuid'      : '234567890abcdefxx',
                'contact_firstname' : 'Jason',
                'contact_lastname'  : 'Smith',
                'contact_nickname'  : '',
                'campus_uuid'       : 'anothercampusuuid',
                'year_id'           : '3',
                'contact_phone'     : '123-456-7890',
                'contact_email'     : 'jason.smith@gmail.com',
                'contact_notes'     : ''
            }
        }
        ]
};

module.exports = function(req, res, next) {

    console.log();
    console.log();
    console.log('--------------------------------------------------');
    console.log('validate user ... ');
    req.appdev = {};
    console.log();
    console.log('from ip addr: '+req.connection.remoteAddress);
    console.log();
    console.log('provided params:');
    console.log(req.body);
    console.log(req.query);
    console.log(req.data);
    console.log();


    // TODO: Implement ADCore.user.current(req).GUID,
    // Assign userLang from session information
    var userGuid = ADCore.user.current(req).GUID();
    var userLang = ADCore.user.current(req).getLanguageCode(); // get user default language from session info

/*
    if ( req.param('test') ) {

        userGuid = '9ACB3BAC-C706-5096-4ED0-2557002E3ADE';

        testClientData.lastSyncTimestamp = Date.now() - 10;



   } else if ( req.param('test2') ) {

        userGuid = '5678';
        req.body.lastSyncTimestamp = Date.now() - 10;
    }
*/

//    var uuid = null;
    NSServerUser.findOne({user_guid:userGuid})
    .done(function(err, userObj){

        if (err) {
            // exit policy chain w/o calling next();
            ADCore.comm.error(res, err);
        }

        else if (userObj) {

            var text = '  - Found existing user, uuid = ' + userObj.user_uuid + '  guid='+userObj.user_guid;
            endValidation({
                    logMsg:text,
                    req:req,
                    userObj:userObj,
                    res:res
                },
                next
            );

        }

        else { // User doesn't exist in model, create new user
            console.log('  - CREATING new user for guid = ' + userGuid);
            var newUUID = AD.util.uuid();
            NSServerUser.create({user_uuid:newUUID, user_guid:userGuid, default_lang:userLang})
            .done(function(err, userObj){
                if (err) {
                    // exit policy chain w/o calling next();
                    var newErr = new Error('Failed to create user during sync');
                    newErr.systemErr = err;
                    ADCore.comm.error(res, newErr);
                } else {

                    var text = '    Created new user record for GUID = ' + userGuid;
                    endValidation({
                            logMsg:text,
                            req:req,
                            userObj:userObj,
                            res:res
                        },
                        next
                    );

                }
            });
        } // else


    }); // .done()
};



var endValidation = function(options, next) {
    var logMsg = options.logMsg;
    var req = options.req;
    var res = options.res;
    var userObj = options.userObj;

    console.log(logMsg);
    req.appdev.userUUID = userObj.user_uuid;
    req.appdev.userLang = userObj.default_lang;


    //// Now give our external system a chance to validate our user's credentials
    var externalSystems = NSServer.externalSystems('validateUser');
    if (externalSystems[sails.config.nsserver.externalSystem]) {

        externalSystems[sails.config.nsserver.externalSystem](req,res)
        .fail(function(err){
            ADCore.comm.error(res, err);
        })
        .then(function( data ){

            // everything completed normally
            next();

        });

    } else {
        var err = new Error('*** Error: NSServerValidateUser: unknown configured system ['+sails.config.nsserver.externalSystem+']');
        console.log(err);
        next(err);
    }

};
