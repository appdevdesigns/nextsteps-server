/**
 * NSServerUserContact
 *
 * @module      :: Model
 * @description :: Association model for users and contacts.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    connection: ['nextStepsServer'],

    tableName : 'nextsteps_user_contact',

    attributes: {


        user_uuid	: 'STRING',


        contact_uuid	: 'STRING'
    },

/*
    // ------------------------------------------------------
    // Life cycle callbacks
    // ------------------------------------------------------
    afterCreate: function(entry, cb) {

        // Following a create, we want to add a transaction for the user who created
        // the contact in case they need to sync multiple devices.
        NSServerContact.findOne({contact_uuid:entry.contact_uuid})
        .done(function(err, contact) {
            if(err) {
                cb(err);
            } else {
                console.log('afterCreate: found contact');
                NSServerUser.findOne({user_uuid:entry.user_uuid})
                .done(function(err, user) {
                    if (err) {
                        cb(err);
                    } else {
                        DBHelper.addTransaction({
                            operation:'create',
                            model:'Contact',
                            obj:contact,
                            user:user
                        })
                        .fail(function(err){
                            cb(err);
                        })
                        .then(function(){
                            cb(null);
                        });
                    }
                });

            }
        });
     }, // afterCreate

//    beforeDestroy: function(criteria, cb) {
//
//        // Prior to a destroy, we want to add a transaction for the user who destroyed
//        // the contact in case they need to sync multiple devices.
//        NSServerUserContact.findOne(criteria)
//        .done(function(err, userContact){
//            if (err) {
//                cb(err);
//            } else {
//
//               NSServerContact.findOne({contact_uuid:userContact.contact_uuid})
//               .done(function(err, contact){
//                   if(err) {
//                       cb(err);
//                   } else {
//                       NSServerUser.findOne({user_uuid:userContact.user_uuid})
//                       .done(function(err, user){
//                           if(err){
//                               console.log(err);
//                               cb(err);
//                           } else {
//
//                             DBHelper.addTransaction('destroy', contact, user)
//                               .then(function(){
//                                   cb(null);
//                               })
//                               .fail(function(err){
//                                   cb(err);
//                               });
//                           }
//                       });
//
//                   }
//               });
//
//            }
//        });
//
//    } // beforeDestroy
*/
};
