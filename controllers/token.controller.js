const { getTokensService } = require("../services/token.service")

const fetchTokens = async (req, res) => {
    try{
        console.log("L-T.C-5", JSON.stringify(req.body))

        const response = await getTokensService(req.body)

        res.status(200).json(response)
    }catch(err){
        if(!err?.errorCode) err.errorCode = "E-T.C-11";
        next(err);
    }
}

module.exports = {
    fetchTokens
}