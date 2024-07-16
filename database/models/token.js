const mongoose = require("mongoose")

const tokenSchema = new mongoose.Schema({
    key: String,
    mint: String,
    supply: String,
    rawData: Object,
    network: String,
    decimals: Number,
    uriData: Object,
    isMutable: Boolean,
    editionNonce: Number,
    tokenStandard: Number,
    updateAuthority: String,
    primarySaleHappened: Boolean,
    uses: mongoose.Schema.Types.Mixed,
    collection: mongoose.Schema.Types.Mixed,
    id: {
        type: mongoose.Types.ObjectId,
        default: mongoose.Types.ObjectId,
        unique: true,
        required: true
    },
    serverTimestamp: {
        type: Date,
        immutable: true,
        default: () => Date.now()
    },
    data: {
        uri: String,
        name: String,
        symbol: {
            type: String,
            required: true
        },
        creators: [Object],
        sellerFeeBasisPoints: Number,
    },
})

module.exports = mongoose.model("Token", tokenSchema)