/**
 * NSServerTag
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */
var $ = require('jquery-deferred');
var AD = require('ad-utils');

module.exports = {

    connection: ['nextStepsServer'],

    tableName : 'nextsteps_tag',

    attributes: {

        tag_uuid	: 'STRING',



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
                'tag_uuid': this.tag_uuid
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
            return this.tag_uuid;
        },



        /**
         * @function _Klass
         *
         * Return the Class for this object.
         *
         * @returns {String}
         */
        _Klass: function() {
            return NSServerTag;
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
        return 'Tag';
    },

    /*
     * @return model for translation table
     */
    getTransModel : function() {
        return NSServerTagTrans;
    },



    /**
     * @function getFieldTransFK
     * return the field used as the foreignKey in the Translation table.
     * @return {string}
     */
    getFieldTransFK:function() {
        return 'tag_id';
    },



    /**
     * @function getFieldUUID
     * Useful for generic routines to know how to link to this table.
     * @return {string}
     */
    getFieldUUID:function() {
        return 'tag_uuid';
    },



    /**
     * @function getTransactionParams
     * Return an object that contains the fields to store in the transaction log params.
     * @return {object}
     */
    getTransactionParams:function() {
        return {
            tag_uuid:1,
            tag_label:1,
       };
    },

};
