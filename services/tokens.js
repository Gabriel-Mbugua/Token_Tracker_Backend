const { options } = require("joi")
const { db } = require("../database/db")

const getTokens = async ({ limit = 20 }) => {
    try{
        const query = {}
        const options = { limit, }

        const tokens = await db.collection("tokens").find(query, options).toArray()
        
        return tokens
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}

module.exports = {
    getTokens
}