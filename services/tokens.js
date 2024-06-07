const { dbClient } = require("../database/db")

const getTokens = async () => {
    try{
        const tokens = await dbClient.collection("tokens").find().toArray()
        
        return tokens
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}

module.exports = {
    getTokens
}