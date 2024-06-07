const { getTokens } = require("../services/tokens")


const fetchTokens = async (req, res) => {
    try{
        const tokens = await getTokens()

        res.status(200).json({
            success: true,
            data: tokens
        })
    }catch(err){
        res.status(400).json({
            success: false,
            message: err.message
        })
    }
}

module.exports = {
    fetchTokens
}