/**
 * NSServerYearTrans
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    connection: ['nextStepsServer'],
        
    tableName : 'nextsteps_year_trans',

    attributes: {


        year_id	: 'INT',


        language_code	: 'STRING',


        year_label	: 'STRING'
    },
    
    /*
     * @return model for translation table
     */ 
    getTransModel : function() {
        return NSServerYearTrans;
    }

};
