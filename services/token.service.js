const TokenModel = require('../database/models/token')
const { fetchRaydiumAccounts } = require("./solana")
const { addDocument } = require("../database/dbOperations")
const { genearteUniqueDbId } = require("../utils/common")

const getTokens = async ({ limit = 20 }) => {
    try{
        const tokens = await TokenModel.find()
        .sort('-serverTimestamp')
        .limit(limit)
        .exec()
        
        return  {
            success: true,
            data: tokens
        }
    }catch(err){
        console.error(err)
        throw new Error(err)
    }
}
// getTokens({}).then(res => console.log(res))

const processTokenJob = async ({ txId }) => {
    try{
        console.log(`L-S-T.S-20 Processing txId: ${txId}`)

        const tokenInfo = await fetchRaydiumAccounts({ txId })
        
        const id = genearteUniqueDbId()

        const saveDocument = await addDocument({
            id,
            model: TokenModel,
            data: {
                id,
                ...tokenInfo,
                creationTimestamp: Date.now(),
                network: "solana"
            },
        })

        return saveDocument
    }catch(err){
        console.error(err)
    }
}

module.exports = {
    getTokensService: getTokens,
    processTokenJobService: processTokenJob
}