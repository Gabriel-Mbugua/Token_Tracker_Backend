const mongoose = require("mongoose")

/**
 * Check if the provided data is valid.
 * 
 * @param {any} data - The data to be validated.
 * @returns {boolean} - Returns true if the data is valid, otherwise false.
 */
const isValidData = (data) => {
    if (data === undefined) return false;
    if (typeof data !== 'object' || data === null) return true;
    
    return Object.entries(data).every(([key, value]) => {
      if (key === '' || key === 'null' || key === 'undefined') return false;
      if (typeof value === 'object') return isValidData(value);
      return true;
    });
};

const genearteUniqueDbId =  () => mongoose.Types.ObjectId()

module.exports = {
    isValidData,
    genearteUniqueDbId,
}