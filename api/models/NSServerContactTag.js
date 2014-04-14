/**
 * NSServerContactTag
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    tableName : 'nextsteps_contact_tag',

    attributes: {

        contacttag_uuid	: 'STRING',


        contact_uuid	: 'STRING',


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
                'contacttag_uuid': this.contacttag_uuid
            };
        },



        /**
         * @function uuid
         *
         * Return the current contacttag_uuid value.
         *
         * @returns {String}
         */
        uuid: function() {
            return this.contacttag_uuid;
        },



        /**
         * @function _Klass
         *
         * Return the Class for this object.
         *
         * @returns {String}
         */
        _Klass: function() {
            return NSServerContactTag;
        }
    },






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
        return 'ContactTag';
    },



    /**
     * @function getFieldUUID
     * Useful for generic routines to know how to link to this table.
     * @return {string}
     */
    getFieldUUID:function() {
        return 'contacttag_uuid';
    },



    /**
     * @function getTransactionParams
     * Return an object that contains the fields to store in the transaction log params.
     * @return {object}
     */
    getTransactionParams:function() {
        return {
            contacttag_uuid : 1,
            contact_uuid    : 1,
            tag_uuid        : 1
       };
    },



};
