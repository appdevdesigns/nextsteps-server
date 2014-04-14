/**
 * NSServerContactStep
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    tableName : 'nextsteps_contact_step',

    attributes: {


        contactstep_uuid	: 'STRING',


        contact_uuid	: 'STRING',


        step_uuid	: 'STRING',


        step_date	: 'DATE',

        step_location : 'STRING',



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
                'contact_uuid': this.contact_uuid,
                'step_uuid': this.step_uuid
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
            return this.contactstep_uuid;
        },



        /**
         * @function _Klass
         *
         * Return the Class for this object.
         *
         * @returns {String}
         */
        _Klass: function() {
            return NSServerContactStep;
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
        return 'ContactStep';
    },



    /**
     * @function getFieldUUID
     * Useful for generic routines to know how to link to this table.
     * @return {string}
     */
    getFieldUUID:function() {
        return 'contactstep_uuid';
    },



    /**
     * @function getTransactionParams
     * Return an object that contains the fields to store in the transaction log params.
     * @return {object}
     */
    getTransactionParams:function() {
        return {
            contactstep_uuid    : 1,
            contact_uuid        : 1,
            step_uuid           : 1,
            step_date           : 1,
            step_location       : 1
       };
    },


};
