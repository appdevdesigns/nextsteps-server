/**
 * NSServerSystem_GMA
 *
 * @module      :: Service
 * @description :: This is the driver for communicating with the GMA system.
 *
 */
var $ = require('jquery-deferred');
var GMA = require('gma-api');
var async = require('async');
var AD = require('ad-utils');

var TestMap = {
};






module.exports = {



    /**
     * @function download
     *
     * *** Required NSServerSystem Interface Method.
     *
     * This method handles pulling data from the GMA system and packaging
     * it in a format the NextStepsServer can understand.
     *
     * @param obj req
     * @param object res
     * @return jQuery Deferred
     */
    download: function( req, res) {
        var dfd = $.Deferred();

        console.log('GMA.download() ...');

        var gma = null;


        async.series([


            //// Step 1:  Make sure we have a gma object
            function(next) {
                gma = params(req,'gma');
                if (gma){
                    next();
                } else {

                    var userID = req.param('username');
                    var password = req.param('password');
                    loginGMA(userID, password, req.connection.remoteAddress)
                    .fail(function(err){
                        next(err);
                    })
                    .then(function(newGma){
                        gma = newGma;
                        next();
                    });
                }
            },


            //// Step 2:  Make sure we have assignments pulled
            function(next) {
                if (params(req,'assignments')){
                    next();
                } else {

                    storeAssignments(req, gma)
                    .fail(function(err){
                        next(err);
                    })
                    .then(function(){
                        next();
                    });
                }
            },


            //// Step 3: Package GMA Data into NSServer format
            function(next) {
                var assignments = params(req, 'assignments');
                var byID = assignments.byID;
                var list = assignments.list;

                // now get measurements and package results in proper format
                packageObjects(byID, list)
                .fail(function(err){
                    next(err);
                })
                .then(function(data, hashMeasurements){

                    // store our measurements for later use
                    params(req, 'measurements', hashMeasurements);

                    // pass the combined package on
                    next(null, data);
                });
            }


        ], function(err, results) {
            if (err) {
                console.log(err);
                dfd.reject(err);
            } else {

                // finally transform the package into NSServer format:
                var data = results.pop();  // <-- data from last step

                for (var id in data.measurements) {

                    var newMeasurementList = [];
                    var currList = data.measurements[id];
                    currList.forEach(function(measurement){
                       newMeasurementList.push(measurement.data);
                    });
                    data.measurements[id] = newMeasurementList;
                }

                dfd.resolve(data);
            }
        });

        return dfd;
    },



    /**
     * @function upload
     *
     * *** Required NSServerSystem Interface Method.
     *
     * This method handles pushing data into the GMA system.
     *
     * When the method completes, all reports impacted by the current
     * user submission will have been updated.
     *
     * @param obj req
     * @param object res
     * @return jQuery Deferred
     */
    upload: function( req, res ) {

        var dfd = $.Deferred();

        console.log('GMA.upload() ...');

        async.series([


              //// Step 1:  Gather All the ContactSteps to process
              // when done: req.nssystem.gma.upload.stepsToDo = {
              //    measurementID:[{ date: ContactSteps.step_date, obj:measurementObj}],
              //    ...
              // }
              function(next) {
AD.log('   GMA.upload().uploadGatherSteps()');
                  uploadGatherSteps(req, next);
              },


              //// Step 2:  Determine Different Reports To Submit
              // when done:  req.nssystem.gma.upload.reportsToSubmit = {
              //     startDate:{ reportId:{Report}, reportId2:{Report}...},
              // }
              function(next) {
AD.log('   GMA.upload().uploadDetermineReports()');
                  uploadDetermineReports(req, next);
              },


              //// Step 3: Submit Reports:
              function(next) {
AD.log('   GMA.upload().uploadSubmitReports()');
                              uploadSubmitReports(req, next);
              }


          ], function(err, results) {

              console.log('upload() final:');

              if (err) {
                  console.log(err);

//// TODO: report Errors in this process to an Administrator
//                          dfd.reject(err);
              } else {


              }
          });

        //// NOTE: this process can continue on in the background
        // without the user having to wait until it is done.
        // Errors should be reported to an Administrator
        dfd.resolve();

        return dfd;
    },


    // These are for exposing private functions for testing only
    // usage:  test('functionName', arg1, arg2, ... argN);
    //
    test: function() {

        if (sails.config.environment != 'production') {
            var args = Array.prototype.slice.call(arguments);
            var key = args.shift();
            if (TestMap[key]) {
                return TestMap[key].apply(undefined, args);
            } else {
                console.log('*** function ['+key+'] not found in testMap');
            }
        } else {
            console.log('*** Can\'t use test() in a production environment');
        }
    },



    /**
     * @function validateUser
     *
     * *** Required NSServerSystem Interface Method.
     *
     * This method attempts to authenticate the user's username/password
     * credentials against GMA.
     *
     * If successful:  req.nssystem.gma.gma is populated with the active gma
     *                 object to be reused for the rest of this Plug-In's
     *                 operation.
     *
     * If unsuccessful: the deferred is rejected.
     *
     * @param string username
     * @param string password
     * @return jQuery Deferred
     */
    validateUser: function(req, res, cb){
        var dfd = $.Deferred();

        console.log('GMA.validatingUser() ... ');


        // Using CAS Restful interface, so login with user/pword
        var userID = req.param('username');
        var password = req.param('password');

        loginGMA(userID, password, req.connection.remoteAddress)
        .fail(function(err){
            if (cb) cb(err);
            dfd.reject(err);
        })
        .then(function(gma){

            // save instance of gma connection for later:
            params(req, 'gma', gma);


            // go ahead and request assignments for later use:
            if (!params(req, 'assignments')) {

                storeAssignments(req, gma)
                .fail(function(err){
                    if (cb) cb(err);
                    dfd.reject(err);
                })
                .then(function(){
                    if (cb) cb();
                    dfd.resolve();
                });

            } else {

                if (cb) cb();
                dfd.resolve();
            }

        });

        return dfd;
    }
};



/**
 * @function loginGMA
 *
 * Authenticate the user's username, password credentials against GMA.
 *
 * If successful, then the active GMA object is returned which can be
 * used to interact with GMA on the user's behalf.
 *
 *
 * @param string username
 * @param string password
 * @return jQuery Deferred
 */
var loginGMA = function(username, password, remoteIP) {
    var dfd = $.Deferred();

//console.log();
//console.log('loginGMA: ');
//console.log('username:'+username);
//console.log('password:'+password);
//console.log();
    remoteIP = remoteIP || '10.0.0.1';

    var gma = new GMA({
        gmaBase: sails.config.nsserver.gmaBaseURL,
        casURL: sails.config.nsserver.casURL,
        forwardedFor:remoteIP // strange case where GMA is on same server as
                              // nextsteps we need to set this
    });

    gma.login(username, password)
    .fail(function(err){
        AD.log.error("  *** Problem logging in to GMA server");
        AD.log.error("  - username:"+username);
//        console.log("  - password:"+password);
        console.log(err);
        dfd.reject(err);
    })
    .then(function(){

        AD.log('<green>  - gma auth results: GID['+gma.GUID+']  '+gma.preferredName+'   '+gma.renId+' </green>');

        dfd.resolve(gma);
    });

    return dfd;

};



/**
 * @function packageNSData
 *
 * Given the Assignment information for the user, parse all the
 * Measurement information associated with these assigments and
 * return them in the following format:
 * {
 *      assignments: {
 *          ID1:'name1',
 *          ID2:'name2',
 *          ...
 *          IDN:'nameN'
 *      },
 *      measurements: {
 *          AssignmentID1:[
 *              {MeasurementObject},
 *              {MeasurementObject}
 *          ]
 *      }
 * }
 *
 * @param string username
 * @param string password
 * @return jQuery Deferred. resolved( gmaData, hashMeasurements)
 */
var packageObjects = function(byID, list) {
    var dfd = $.Deferred();

    var gmaData = {};
    var hashMeasurements = {}; // {  measurement_id : { measurementObj } }


    console.log("  - gma returned "+list.length+' assignments');

    gmaData.assignments = byID;
    gmaData.measurements = {};

    var numDone = 0;
    list.forEach(function(assignment) {
        assignment.getMeasurements()
        .fail(function(err){
            dfd.reject(err);
        })
        .then(function(listMeasurements){
            console.log('    - assignment '+assignment.nodeId+' has '+listMeasurements.length+' measurements ');

            //// NOTE: 0 measurements is a sign that the given assignment is inactive
            ////       ==> current decision is to remove that assignment from gmaData.assignments[assignmentID] 

            if (listMeasurements.length == 0) {

                console.log('      -> removing assignment from our data.');
                delete gmaData.assignments[assignment.nodeId];
                delete gmaData.measurements[assignment.nodeId];

            } else {

                // add these measurements to the gmaData format:
                gmaData.measurements[assignment.nodeId] = listMeasurements;
                listMeasurements.forEach(function(measurement){
                    hashMeasurements[measurement.id()] = measurement;
                });
            }
            numDone++;
            if (numDone >= list.length) {
                dfd.resolve(gmaData, hashMeasurements);
            }
        });
    });


    return dfd;
};



/**
 * @function params
 *
 * A utility function to help manage [get/set]ing values to the
 * req object.
 *
 * @codestart
 * params(req, 'myval', true);
 *
 * if (params(req,'myval')) {
 *     console.log("it's true!");
 * }
 * @codeend
 *
 * @param obj req
 * @param string key
 * @param mixed value
 * @return mixed if no value is given, 'undefined' otherwise
 */
var params = function( req, key, value) {

    if (typeof req['nsserver'] == 'undefined') req.nsserver = {};
    if (typeof req.nsserver['gma'] == 'undefined') req.nsserver.gma = {};

    if ( typeof value == 'undefined') {
        // they are requesting a value
        return req.nsserver.gma[key];
    } else {
        req.nsserver.gma[key] = value;
    }
};



/**
 * @function storeAssignments
 *
 * Store the current user's GMA assignments into the req object.
 *
 * on a successful completion, we will store :
 *  req.nssystem.gma.assignments.list = [ {AssignmentObject},...]
 *  req.nssystem.gma.assignments.byID = { ID:'name', ID2:'name2', ... }
 *
 * @param object req
 * @param object gma
 * @return jQuery Deferred
 */
var storeAssignments = function(req, gma) {
    var dfd = $.Deferred();

    params(req, 'assignments', null);

    gma.getAssignments()
    .fail(function(err){
        console.log("    * Problem fetching user assignments");
        console.log(err);
        dfd.reject(err);
    })
    .then(function(byID, byName, list) {
        var assignments = {
                list:list,
                byID:byID
        };
        params(req, 'assignments', assignments);

        dfd.resolve();
    });

    return dfd;
};





//----------------------------------------------------------------------------
// Upload Routines
//----------------------------------------------------------------------------



/**
 * @function uploadDetermineReports
 *
 * Determine Different Reports To Submit
 *
 * for entry in stepsToDo
 *     foreach date in entry.dates[]
 *         get Report for date
 *         store in reportsToSubmit
 *
 * when done:  req.nssystem.gma.upload.reportsToSubmit = {
 *     startDate:{ reportId:{Report}, reportId2:{Report}...},
 * }
 *
 * @param object req
 * @param fn done   (async library callback)
 * @return jQuery Deferred
 */
var uploadDetermineReports = TestMap.uploadDetermineReports = function(req, done) {

    AD.log('    . uploadDetermineReports()');
    var upload = params(req,'upload');
    var stepsToDo = upload.stepsToDo;


    var reportsToSubmit = {};   // a hash of the reports that need to be submitted

    //store this in our req.nsserver.gma.upload data structure
    upload.reportsToSubmit = reportsToSubmit;


    var numToDo = 0;
    var numDone = 0;

    // for entry in stepsToDo
    for (var m_id in stepsToDo){
        var entry = stepsToDo[m_id];
        var measurement = entry.obj;
//AD.log('<yellow>measurement:</yellow>',measurement);

        // for date in entry.dates[]
        entry.dates.forEach(function(date){

            numToDo++;

            // get Report for date
            measurement.report.reportForDate(date)
            .fail(function(err){
                AD.log.error('*** error getting a report for date: '+date);
                AD.log.error(err);
                done(err);
            })
            .then(function(report){

                if (report) {

                    // make sure there is an entry for the given startDate
                    if ( typeof reportsToSubmit[report.startDate] == 'undefined'){
                        reportsToSubmit[report.startDate] = {};
                    }
                    reportsToSubmit[report.startDate][report.reportId] = report;

                } else {

                    // this is strange not to have a report for that date
                    // perhaps this is a new GMA installation with no previous
                    // reports?
                    console.log('   *** WARN: no report returned for date: '+date);
                }

                // if we have pulled all our reports
                numDone++;
                if (numDone >= numToDo) {
                    done();
                }

            }); // end then()

        }); // end forEach()

    } // end for(steps)


    // if there was nothing to do, then continue on:
    if (numToDo == 0) {
        done();
    }

};  // end uploadDetermineReports()



/**
 * @function uploadGatherSteps
 *
 * Gather the Contact Steps being modified during this transaction
 *
 * when done: req.nssystem.gma.upload.stepsToDo = {
 *    measurementID:{ obj:measurementObj, dates:['date1', 'date2', ..., 'dateN']}
 *    ...
 * }
 *
 * @param object req
 * @param object gma
 * @return jQuery Deferred
 */
var uploadGatherSteps = TestMap.uploadGatherSteps = function(req, done) {

    // get the transactionLog
    var xLog = req.param('transactionLog');

    var listTransactions = [];
    var listSteps = [];

    async.series([


                  // make a list of all ContactStep model transactions
                  function(next) {
//console.log('uploadGatherSteps(): make a list of all model transactions');
                      xLog.forEach(function( entry) {
                          if (entry.model == 'ContactStep') {

                              // Actually we only want entries that have a
                              // valid step_date value
                              var date = entry.params.step_date + '';
//console.log('date value['+date+']');
                              if ((date != '')
                                  && (date != 'null')
                                  && (date != 'undefined')
                                  && (date != null)) {

                                  listTransactions.push(entry);
                              }

                          }
                      });

                      next();
                  },



                  // translate this into a list of all Steps
                  function(next) {
//console.log('uploadGatherSteps(): translate this into a list of all Steps');
                      var numDone=0;
                      listTransactions.forEach(function(transaction){

                          NSServerSteps.findOne({step_uuid: transaction.params.step_uuid })
                          .fail(function(err){
                              next(err);
                          })
                          .then(function(step){

                              // if this is a valid entry:
                              if (typeof step != 'undefined') {

                                  var entry = { date:transaction.params.step_date, step:step };

                                  listSteps.push(entry);

                              } else {

                                  // this is weird: the step_uuid did not match one of our entries!
                                  // don't add to list
                                  // alert a developer to look into why!
////TODO: alert a developer
AD.log.error('*** Error: uploadGatherSteps():  a received transactionLog entry updating a step, did not match any of our DB.steps!');
AD.log.error(transaction);

                              }

                              // if we have completed all the transactions -> next();
                              numDone++;
                              if (numDone >= listTransactions.length){
                                  next();
                              }
                          });
                      });

                      // if there was nothing to process then continue on
                      if (listTransactions.length == 0) {
                          next();
                      }
                  },



                  // foreach step find the measurement Obj with the step.measurement_id
                  // package these all together
                  function(next) {

                      // this should have been stored by now (see packageObjects() )
                      var hashMeasurements = params(req, 'measurements');

                      var pkg = {}; // final package object


                      listSteps.forEach(function(entry){
                          var step = entry.step;
                          var date = entry.date;

                          // get the measurement obj related to this step
                          var currMeasurement = hashMeasurements[step.measurement_id];
                          if (typeof currMeasurement == 'undefined') {

                              AD.log('   *** step uuid['+step.step_uuid+'] m_id['+step.measurement_id+'] did not match any of my measurements');
                              AD.log('       hashMeasurements keys['+Object.keys(hashMeasurements) + ']' );


                          } else {


                              // if we have not added this measurement to the package yet
                              if (typeof pkg[step.measurement_id] == 'undefined') {
                                  pkg[step.measurement_id] = { obj:currMeasurement, dates:[]};
                              }

                              // add the step date to the list of dates for this measurement
                              pkg[step.measurement_id].dates.push(date);

                          }
                      });

                      next(null, pkg);
                  },


    ], function(err, results) {
//console.log('uploadGatherSteps(): final return:');
        if (err) {
            AD.log(err);
            done(err);
        } else {
            //// NOTE: results is an array of return values from all the fn() above
            ////       we want the results from the 3rd fn() :  results[2]

            // save in req.nssystem.gma.upload.stepsToDo
            var upload = {
                    stepsToDo:results[2]
            };
            params(req, 'upload', upload);

            // all done!
            done();
        }
    });

};  // end uploadGatherSteps()



/**
 * @function uploadSubmitReports
 *
 * Now step through all the reportsToSubmit{} and submit the data.
 *
 * For each startDate
 *  For each report
 *    for each measurement
 *        gather all ContactSteps for time period
 *        measurement.value( length of array)
 *        measurement.save();
 *
 * @param object req
 * @param fn     done   async callback fun
 */
var uploadSubmitReports = TestMap.uploadSubmitReports = function(req, done) {

    AD.log('<green>.uploadSubmitReports():</green>');

    // get the reportsToSubmit from last step
    var upload = params(req, 'upload');
    var reportsToSubmit = upload.reportsToSubmit;


    var listMeasurements = {};  // the data structure to compile the data into.
    var listContacts = [];

    async.series([


                  // make a list of reports->Measurements
                  // { reportID:[{ obj:MeasurementObj }, ... ] }
                  function(next) {
                      var numDone = 0;
                      var numToDo = 0;

                      for (var date in reportsToSubmit) {

                          for (var rID in reportsToSubmit[date]) {

                              var report = reportsToSubmit[date][rID];

// if (typeof report == 'undefined') {
// AD.log('<red>!!! : report is undefined!</red>');
// }

                              if (typeof listMeasurements[report.id()] == 'undefined') {
                                  listMeasurements[report.id()] = [];
                              }

                              // the num of reports looking up measurements
                              numToDo++;

                              report.measurements()
                              .fail(function(err){
                                  AD.log.error('*** error getting measurements from report!  id:'+report.id());
                                  next(err);
                              })
                              .then(function(measurements){
// AD.log('<yellow> measurements:</yellow>', measurements);
                                  for(var strat in measurements) {

                                      // add all these measurements to our list[reportId]
                                      measurements[strat].forEach(function(measurement){
                                          listMeasurements[measurement.report.id()].push({ obj:measurement });
                                      });

                                  }

                                  // if we are all done, continue
                                  numDone++;
                                  if (numDone >= numToDo) {
//console.log('1: listMeasurements:');
//console.log(listMeasurements);
                                      next();
                                  }

                              });

                          }

                      }

                      // if there was nothing to do then continue
                      if (numToDo == 0) {
                          next();
                      }
                  },



                  // attach the steps associated with each measurement:
                  // { reportID:[{ obj:MObj, step:StepObj}, ... ] }
                  function(next) {
// AD.log('<green>.listMeasurements() : </green>');
// AD.log(listMeasurements);

                      var numToDo = 0;
                      var numDone = 0;
                      for (var rid in listMeasurements) {
                          listMeasurements[rid].forEach(function(entry){
                             numToDo++;

                             NSServerSteps.findOne({ measurement_id: entry.obj.id() })
                             .fail(function(err){
                                 next(err);
                             })
                             .then(function(step){

// if (typeof step == 'undefined') {
//     AD.log('<red>!!! : returned step is undefined!</red><yellow> entry.obj.id() : </yellow>', entry.obj.id());
// //    AD.log(entry);
// }
                                if (step) {

                                    entry.step = step;

                                    numDone++;
                                    if (numDone >= numToDo) {

//console.log('2: listMeasurements: attaching steps:');
//console.log(listMeasurements);
                                        next();
                                    }

                                } else {

                                    //// NOTE: if we don't get a step back, then this is
                                    ////       actually a new measurement that was added 
                                    ////       sometime after our initial Campus/Steps were
                                    ////       created initially ... joy
                                    //// 
                                    ////       so, we need to ADD this measurement to our system!
                                    ////  

//AD.log('<yellow><bold>unknown measurement:</bold>  adding it to our system. </yellow>');
//AD.log('<red><bold>TODO:</bold> refactor server to actually add this!</red>');

                                    // Actuall: current decision is to wait until this is a real life
                                    // situation and then ask our customers how we should handle this.
AD.log('<yellow><bold>unknown measurement:</bold>  id:'+ entry.obj.id() + ' </yellow>');


                                    numDone++;
                                    if (numDone >= numToDo) {

                                        next();
                                    }


                                }


                             });
                          });
                      }

                      // if there was nothing to do, continue
                      if (numToDo == 0) {
                          next();
                      }
                  },



                  // attach an array of contact_uuids tied to this user:
                  // store in listContacts
                  function(next) {

                      // get user.guid
                      var guid = ADCore.user.current(req).GUID();

                      // lookup User by guid
                      NSServerUser.find({ user_guid:guid })
                      .fail(function(err){
                          AD.log.error('*** Error trying to lookup User with guid['+guid+']');
                          next(err);
                      })
                      .then(function(user){

                          if (user.length == 0) {

                              // couldn't find user!?
                              var err = new Error('*** Error: couldn\'t find user for guid:'+guid);
                              AD.log.error(err);
                              next(err);

                          } else {


                              // with USER, lookup all UserContacts using USER.user_uuid
                              NSServerUserContact.find({ user_uuid: user[0].user_uuid })
                              .fail(function(err){
                                  AD.log.error('*** Error trying to lookup UserContact with user_uuid:'+user.user_uuid);
                                  next(err);
                              })
                              .then(function(contacts){

                                  contacts.forEach(function(contact){
                                      listContacts.push(contact.contact_uuid);
                                  });
//console.log('3: listContacts:');
//console.log(listContacts);
                                  next();
                              });

                          }

                      });

                  },



                  // attach the ContactSteps that fall within the start & end dates
                  // of the Measurement's Report object.
                  // { reportID:[ {obj:MObj, step:SObj, contactSteps:[{obj}, {obj}...] }] }
                  function(next) {
AD.log('<green> .ContactSteps that fall withing start & end dates:</green>');

                      var numToDo = 0;
                      var numDone = 0;
                      for (var rid in listMeasurements) {

                          listMeasurements[rid].forEach(function(entry){


                            // NOTE: because we live in a fallen world, not everything
                            //       works as expected, and it is possible to get here
                            //       without a valid step!
                            //
                            //       only try to lookup contactSteps if we have a valid 
                            //       step defined!



                                numToDo++;

                                entry.contactSteps = [];

                                // OK: GMA dates are in format 20140311
                                //     step_date has format: 2014-03-11T05:00:00.000Z
                                // so convert GMA -> step_date
                                var report = entry.obj.report;
if(typeof report == 'undefined') {
    AD.log('<red> !!! entry.obj.report is undefined!!</red>');
}
                                var period = report.period();  // "2014-03-11 &ndash; 2014-03-15"
                                var parts = period.split(' &ndash; ');

                                var startDate = parts[0] + 'T00:00:00.000Z';
                                var endDate = parts[1] + 'T23:59:59.000Z';


// if (typeof entry.step == 'undefined') {
//     AD.log('<red>!!! entry.step is undefined for entry:</red>', entry.data); 
// } else {
//     if (typeof entry.step.step_uuid == 'undefined') {
//         AD.log('<red>!!! entry.step.step_uuid is undefined for entry:</red>', entry.data);
//     }
// }

                                if ('undefined' != typeof entry.step) {


                                    // now lookup ContactSteps
                                    //     startDate <= step_date <= endDate
                                    //     step_uuid = current step.uuid
                                    //     contact_uuid IN listContacts
                                    //// NOTE: in the future when we have values that
                                    ////       are running totals, switch date check to:
                                    ////       step_date <= endDate
                                    NSServerContactStep.find()
                                    .where({step_date:{ ">=":startDate}})
                                    .where({step_date:{ "<=":endDate}})
                                    .where({step_uuid: entry.step.step_uuid })
                                    .where({contact_uuid:listContacts})
                                    .fail(function(err){
                                        next(err);
                                    })
                                    .then(function(list){

                                        entry.contactSteps = list;

                                        numDone++;
                                        if (numDone >= numToDo) {
                                            // console.log('4: listMeasurements with contactSteps:');
                                            // console.log(listMeasurements);
                                            next();
                                        }
                                    });


                                } else {

                                    // if we get here without a step, move along.
                                    // the contactSteps should be [] which results in a 0 value submitted. 

                                    numDone++;
                                    if (numDone >= numToDo) {
                                        next();
                                    }
                                }

                            
                          });
                      }


                      // if there was nothing to do then continue
                      if (numToDo == 0) {
                          next();
                      }
                  },



                  // Now have the measurement submit it's new values
                  // { reportID:[ {obj:MObj, step:SObj, contactSteps:[{obj}, {obj}...] }] }
                  function(next) {
AD.log('5: trying to submit data now():')
//AD.log('listMeasurements:');
//AD.log(listMeasurements);


                      var numToDo = 0;
                      var numDone = 0;
                      for (var rid in listMeasurements) {

                          // In order to speed up this process, we're going to update all the
                          // measurements then tell the Report to submit itself.
                          var report = null;

                          listMeasurements[rid].forEach(function(entry){

                              // pull the report from the Measurement object
                              if (report == null) report = entry.obj.getReport();

AD.log('   - updating measurement # '+entry.obj.id()+' value:'+ (entry.contactSteps.length));
                              entry.obj.value( entry.contactSteps.length );

                          });

                          if (report) {
                              numToDo ++;
                              console.log('       - now saving report: '+report.id());
                              report.save()
                              .fail(function(err){
                                  console.log("*** error saving Report ");
                                  next(err);
                              })
                              .then(function(){

                                 numDone++;
                                  if (numDone >= numToDo) {
AD.log('   - saving complete!');
                                      next();
                                  }
                              });
                          }
                      }

                      // if there was nothing to do, just continue on
                      if (numToDo == 0) {
AD.log('   - saving ... nothing to do.');

                          // there was nothing to do.
                          next();
                      }
                  },


    ], function(err, results) {
        if (err) {
            console.log(err);
            done(err);
        } else {

            // all done!
            done();
        }
    });

};  // end uploadSubmitReports()

