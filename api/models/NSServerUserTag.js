/**
 * NSServerUserTag
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

	connection: ['nextStepsServer'],

    tableName : 'nextsteps_user_tag',

    attributes: {

        user_uuid	: 'STRING',


        tag_uuid	: 'STRING'
    }

};
