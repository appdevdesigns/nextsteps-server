/**
 * NSServerSyncFromGMA
 *
 * @module      :: Policy
 * @description :: Retrieve Assignments and Measurements from GMA.
 *                 Apply any changes to our tables
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */

var $ = require('jquery-deferred');
var AD = require('ad-utils');

//// This is where we define our known adaptors:
var externalSystems = null;


module.exports = function(req, res, next) {

    if (externalSystems == null) {
        externalSystems = {
                'none': function(req, res) { var dfd = $.Deferred(); dfd.resolve({assignments:{}, measurements:{}}); return dfd; },
                'test': NSServerSystem_Test.download,
                'GMA' : NSServerSystem_GMA.download
        };
    }

    if (externalSystems[sails.config.nsserver.externalSystem]) {


        externalSystems[sails.config.nsserver.externalSystem](req,res)
        .fail(function(err){
            AD.log('---> sending Error:');
            AD.log.error(err);
            ADCore.comm.error(res, err);
        })
        .then(function( data ){

            // External data retrieved; now make sure we're in sync
            syncAssignments({
                req:req,
                assignments:data.assignments,
                userUUID:req.appdev.userUUID
            })
            .fail(function(err){
                ADCore.comm.error(res, err);
            })
            .then(function(){

                syncMeasurements({
                    req:req,
                    measurements:data.measurements
                })
                .fail(function(err){
                    ADCore.comm.error(res, err);
                })
                .then(function(){
                    next();
                });
            });

        });

    } else {

        var err = new Error('*** Error: unknown configured system ['+sails.config.nsserver.externalSystem+']');
        AD.log.error(err);
        next(err);
    }

};





var updateCampus = function(opts) {
    var dfd = $.Deferred();

    var req = opts.req;
    var campus = opts.campus;
    var name = opts.name;
//AD.log('updateCampus():');

    NSServerCampusTrans.findOne({
        campus_id: campus.id,
        language_code: ADCore.user.current(req).getLanguageCode()
    })
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(trans){
//AD.log('  updateCampus():NSServerCampusTrans.findOne().then():');
        // NOTE: campus_label is VARCHAR(255) ... so don't try to compare more than that.
        if (trans && (name.substr(0,255) != trans.campus_label)){
            console.log('   - updating campus id['+campus.node_id+'] -> label ['+name+']');
            trans.campus_label = name;
            trans.save(function(err){
                if (err){
                    dfd.reject(err);
                } else {
                    dfd.resolve();
                }
            });
        } else if (trans) {
            dfd.resolve();
        } else {
            var err = new Error("Data error: Campus Translation Entry not found. id["+campus.id+']');
            dfd.reject(err);
        }
    });

    return dfd;
};



var createCampus = function(opts) {
//    var dfd = $.Deferred();

    var req = opts.req;
    var gmaId = opts.gmaId;
    var name = opts.name;

    var uuid = AD.util.uuid();
    var log = '    <green><bold>creating:</bold></green> campus for assignment '+gmaId+'   uuid=['+uuid+']';

    var params = {
        campus_uuid: uuid,
        node_id: gmaId,
        language_code: ADCore.user.current(req).getLanguageCode(),
        campus_label: name
    };

    var userUUID = null;
    if ('undefined' != typeof req.appdev.userUUID) {
        userUUID = req.appdev.userUUID;
    } else {
        AD.log.error('*** Shoot! req.appdev.userUUID not defined yet.  How?!');
    }

    return DBHelper.applyMultilingualTransaction({
        userUUID:userUUID,
        operation:'create',
        params:params,
        table:NSServerCampus,
        assocTable:NSServerUserCampus,
        log:log
    });
};



var processNode = function(opts){
    var dfd = $.Deferred();

    var req = opts.req;
    var gmaId = opts.id;
    var name = opts.name;

    console.log('  - looking for a campus for assignment '+gmaId);

    NSServerCampus.findOne({
        node_id: gmaId
    })
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(campus){

        if (campus){
            // Update the campus
            console.log('    - found campus for assignment '+gmaId);
            updateCampus({
                req:req,
                campus:campus,
                name:name
            })
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(){
                dfd.resolve();
            });
        } else {

            // Create the campus
            createCampus({
                req: req,
                gmaId:gmaId,
                name:name
            })
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(){
                dfd.resolve();
            });
        }
    });

    return dfd;
};



var syncNodeData = function(opts){
    var dfd = $.Deferred();

    var req = opts.req;
    var nodes = opts.assignments;

    var numDone = 0;
    var numToDo = 0;

    for (var id in nodes){
        processNode({
            req:req,
            id:id,
            name:nodes[id]
        })
        .fail(function(err){
            numDone++;
            dfd.reject(err);
        })
        .then(function(){
            numDone++;
            if (numDone == numToDo){
//AD.log('  syncNodeData ... done.');
                dfd.resolve();
            }
        });
        numToDo++;
    }
    return dfd;
};



var addUserToCampus = function(userUUID, campus) {
    var dfd = $.Deferred();

    NSServerUserCampus.findOne({
        user_uuid: userUUID,
        campus_uuid: campus.campus_uuid
    })
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(userCampus){
        if (!userCampus){
            AD.log('    <green><bold>adding:</bold></green> user to campus/assignment '+campus.node_id);
            // Need to create one
            NSServerUserCampus.create({
                user_uuid: userUUID,
                campus_uuid: campus.campus_uuid
            })
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(){
                dfd.resolve();
            });
        } else {
            // Nothing to do
            dfd.resolve();
        }

    });

    return dfd;
};



var addUserToNodes = function(userUUID, nodes) {
    var dfd = $.Deferred();

    var numDone = 0;
    var numToDo = 0;

    for (var id in nodes){
        NSServerCampus.findOne({
            node_id: id
        })
        .fail(function(err){
            dfd.reject(err);
        })
        .then(function(campus){
            if (campus){
                addUserToCampus(userUUID, campus)
                .fail(function(err){
                    dfd.reject(err);
                })
                .then(function(){
                    numDone++;
                    if (numDone == numToDo){
                        dfd.resolve();
                    }
                });
            } else {
                var err = new Error("Data error:  Campus not found");
                dfd.reject(err);
            }

        });
        numToDo++;
    }

    // if we didn't have anything to do, then resolve()
    if (numToDo == 0) {
        dfd.resolve();
    }

    return dfd;
};



var getCampusesForUser = function(userUUID) {
    var dfd = $.Deferred();
    DBHelper.manyThrough(NSServerUserCampus, {user_uuid:userUUID}, NSServerCampus, 'campus_uuid', 'campus_uuid', {})
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(listCampuses) {
        dfd.resolve(listCampuses);
    });
    return dfd;
};


var removeUserFromNodes = function(userUUID, assignments) {
    var dfd = $.Deferred();

    getCampusesForUser(userUUID)
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(campuses){

        var numDone = 0;
        var numToDo = campuses.length;
        campuses.forEach(function(campus){
            var nodeId = campus.node_id;

            // a user defined campus should have a nodeId == null
            // if this is not a user defined campus,
            if (nodeId != null) {

                // if this isn't one of our assignments
                if (typeof (assignments[nodeId]) == 'undefined') {

                    // Need to remove this node from the user
                    // since there is no assignment in GMA
                    console.log('    - removing user from campus / assignment '+campus.node_id);

                    NSServerUserCampus.destroy({
                        user_uuid: userUUID,
                        campus_uuid: campus.campus_uuid
                    })
                    .fail(function(err){
                        dfd.reject(err);
                    })
                    .then(function(){
                        numDone++;
                        if (numDone == numToDo) {
                            dfd.resolve();
                        }
                    });

                } else {
                    numDone++;
                }

            } else {

                numDone++;

            } // if nodeId != null
        });
        if (numDone == numToDo) {
            dfd.resolve();
        }
    });

    return dfd;
};



var syncAssignments = function(opts) {
    var dfd = $.Deferred();

    var assignments = opts.assignments;
    var userUUID = opts.userUUID;
    var req = opts.req;

    console.log('  getting assignments ... ');

    // Make sure our tables match the latest from GMA
    syncNodeData({
        req: req,
        assignments:assignments
    })
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(){
//AD.log('before addUserToNodes:');

        // Update User-Node assignments
        addUserToNodes(userUUID, assignments)
        .fail(function(err){
            dfd.reject(err);
        })
        .then(function(){
//AD.log('addUserToNodes().then():');
            removeUserFromNodes(userUUID, assignments)
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(){
//AD.log('removeUserFromNodes().then():');
                dfd.resolve();
            });
        });
    });

    return dfd;
};



var updateStep = function(opts) {
    var dfd = $.Deferred();

    var req = opts.req;
    var step = opts.step;
    var measurement = opts.measurement;

    NSServerStepsTrans.findOne({
        step_id: step.id,
        language_code: ADCore.user.current(req).getLanguageCode()
    })
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(trans){

        // NOTE: our step_* fields are varchar(255), but measurement* fields
        //       can be > 255, so only compare on substr(0,255)
        if (trans
            && (   (trans.step_label != measurement.measurementName.substr(0,255))
                || (trans.step_description != measurement.measurementDescription.substr(0,255))) ){

//            console.log('    - updating step/measurement m_id:'+measurement.measurementId);
//            console.log('       - name:'+measurement.measurementName);
//            console.log('       - description:'+measurement.measurementDescription);
//            console.log('       - length(desc):'+ measurement.measurementDescription.length);

            trans.step_label = measurement.measurementName;
            trans.step_description = measurement.measurementDescription;
            trans.save(function(err){
                if (err){
                    dfd.reject(err);
                } else {
                    dfd.resolve();
                }

            });
        } else if (trans) {
            dfd.resolve();
        } else {
            var err = new Error("Data error:  Translation Entry not found");
            dfd.reject(err);
        }
    });

    return dfd;
};



var createStep = function(opts) {
    var dfd = $.Deferred();

    var req = opts.req;
    var campusUUID = opts.campusUUID;
    var measurement = opts.measurement;

//    console.log('    - creating new step/measurement m_id:'+measurement.measurementId);


    var log = '    <green><bold>created:</bold></green> new step/measurement m_id:'+measurement.measurementId+'  for campus:'+campusUUID;

    var params = {
          step_uuid: AD.util.uuid(),
          campus_uuid: campusUUID,
          measurement_id: measurement.measurementId,
          language_code: ADCore.user.current(req).getLanguageCode(),
          step_label: measurement.measurementName,
          step_description: measurement.measurementDescription
      };

    var userUUID = null;
    if ('undefined' != typeof req.appdev.userUUID) {
        userUUID = req.appdev.userUUID;
    } else {
AD.log.error('*** Shoot! req.appdev.userUUID not defined yet.  How?!');
    }


    return DBHelper.applyMultilingualTransaction({
        userUUID:userUUID,
        operation:'create',
        params:params,
        table:NSServerSteps,
        assocTable:NSServerUserSteps,
        log:log
    });
//
//    NSServerSteps.create({
//        step_uuid: AD.util.uuid(),
//        campus_uuid: campusUUID,
//        measurement_id: measurement.measurementId
//    })
//    .fail(function(err){
//        AD.log.error('<bold>ERROR:</bold> creating Step:');
//        console.log(err);
//        dfd.reject(err);
//    })
//    .then(function(step){
//
//        step.addTranslation({
//            language_code: ADCore.user.current(req).getLanguageCode(),
//            step_label: measurement.measurementName,
//            step_description: measurement.measurementDescription
//        })
//        .fail(function(err){
//            dfd.reject(err);
//        })
//        .then(function(){
//            AD.log('    <green><bold>created:</bold></green> new step/measurement m_id:'+measurement.measurementId+'  for campus:'+campusUUID);
//            dfd.resolve();
//        });
//    });
//    return dfd;
};



var processMeasurement = function(opts) {
    var dfd = $.Deferred();

    var req = opts.req;
    var campusUUID = opts.campusUUID;
    var measurement = opts.measurement;

    NSServerSteps.findOne({
        campus_uuid: campusUUID,
        measurement_id: measurement.measurementId
    })
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(step){
        if (step){
            // Update the step
            updateStep({
                req:req,
                step:step,
                measurement:measurement
            })
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(){
                dfd.resolve();
            });
        } else {
            // Create the step
            createStep({
                req:req,
                campusUUID:campusUUID,
                measurement:measurement
            })
            .fail(function(err){
                dfd.reject(err);
            })
            .then(function(){
                dfd.resolve();
            });
        }
    });

    return dfd;

};



var processNodeMeasurements = function(opts) {
    var dfd = $.Deferred();

    var req = opts.req;
    var nodeId = opts.nodeId;
    var measurements = opts.measurements;

    // if there are measurements to process
    if (measurements.length>0) {

        // Find the campus
        NSServerCampus.findOne({
            node_id: nodeId
        })
        .fail(function(err){
            dfd.reject(err);
        })
        .then(function(campus){
            if (campus){
                var numDone = 0;
                var numToDo = 0;

                for (var id in measurements){
                    processMeasurement({
                        req:req,
                        campusUUID:campus.campus_uuid,
                        measurement:measurements[id]
                    })
                    .fail(function(err){
                        dfd.reject(err);
                    })
                    .then(function(){
                        numDone++;
                        if (numDone == numToDo){
//AD.log('   - all measurements processed');
                            dfd.resolve();
                        }
                    });
                    numToDo++;
                }
                if (numToDo == 0) {
                    dfd.resolve();
                }
            } else {
                dfd.resolve();
            }
        });

    } else {

        // there were no measurements assigned to this nodeID ... why?
        console.log(' there were no measurements assigned to nodeID['+nodeId+']');
        console.log('   ==> that doesn\'t seem like expected behavior!');

        dfd.resolve();
    }

    return dfd;

};



var syncMeasurementData = function(opts) {
    var dfd = $.Deferred();

    var req = opts.req;
    var measurements = opts.measurements;

    var numDone = 0;
    var numToDo = 0;

    for (var nodeId in measurements){
        numToDo++;
        processNodeMeasurements({
            req: req,
            nodeId: nodeId,
            measurements:measurements[nodeId]
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
    }
    if (numToDo == 0){
        dfd.resolve();
    }

    return dfd;
};



var syncMeasurements = function( opts ) {
    var dfd = $.Deferred();

    var req = opts.req;
    var measurements = opts.measurements;

    console.log('getting measurements ... ');

    // Make sure our tables match the latest from GMA
    syncMeasurementData({
        req:req,
        measurements:measurements
    })
    .fail(function(err){
        dfd.reject(err);
    })
    .then(function(){
        dfd.resolve();
    });
    return dfd;
};



