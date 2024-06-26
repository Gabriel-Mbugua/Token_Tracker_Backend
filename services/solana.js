const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { AccountLayout, u64, getMint } = require('@solana/spl-token');
const { Metadata, deprecated } = require('@metaplex-foundation/mpl-token-metadata');

const { generateSolanaExplorerUrl, cleanString } = require('./tools');
const { addJob } = require('../messageQueue/queue');
const { solana, SOLANA_LISTENER } = require('../config/config');

let credits = 0
const HTTP_URL= solana.httpUrl;
const WS_URL= solana.wsUrl;
const SESSION_HASH = `GM${Math.ceil(Math.random() * 1e9)}`

const RAYDIUM_PUBLIC_KEY = solana.raydiumPublicKey;
const INSTRUCTION_NAME = solana.instructionName;
const excludedPublickKeys = solana.excludedPublickKeys

const connection = new Connection(HTTP_URL, {
    wsEndpoint: WS_URL,
    // httpHeaders: { 'x-session-hash': SESSION_HASH }
});

/**
 * Retrieves data from a given URI using an HTTP GET request.
 * Handles errors by logging them and returns the fetched data or null if an error occurs.
 * @param {string} uri - The URI from which data needs to be fetched.
 * @returns {Promise<any>} - The fetched data or null if an error occurs.
 */
const fetchUriData = async (uri) => {
    try {
        const response = await axios.get(uri);
        return response.data;
    } catch (err) {
        console.error(`Error fetching URI data: ${uri}`,err.message);
        return null;
    }
}
// fetchUriData("https://arweave.net/Ho26uxZTJe_yP1nEVdcZ7vcHUChcrWNGz3CrtsjPFpA").then(res => console.log(res))

/**
 * Retrieves detailed information about a Solana mint address, including its metadata and associated URI data.
 * @param {string} mintAddressStr - The mint address on the Solana blockchain.
 * @param {Connection} connection - An instance of the Solana Connection class.
 * @returns {Promise<Object>} - An object containing mint details and metadata.
 */
const fetchMintInfo = async (mintAddressStr, connection) => {
    try {
        const mintAddress = new PublicKey(mintAddressStr);

        const mintInfo = await getMint(connection, mintAddress);
        console.log("Decimals: " + mintInfo.decimals);
        console.log("Supply: " + mintInfo.supply);

        const metadataPda = await deprecated.Metadata.getPDA(mintAddress);
        const metadataContent = await Metadata.fromAccountAddress(connection, metadataPda);

        let uriData = "MISSING";
        if (metadataContent?.data?.uri) uriData = await fetchUriData(metadataContent?.data?.uri);

        const metadata = {
            key: metadataContent.key.toString(),
            updateAuthority: metadataContent.updateAuthority.toString(),
            mint: metadataContent.mint.toString(),
            rawData: metadataContent.data,
            data: {
                name: cleanString(metadataContent.data.name),
                symbol: cleanString(metadataContent.data.symbol),
                uri: cleanString(metadataContent.data.uri),
                sellerFeeBasisPoints: metadataContent.data.sellerFeeBasisPoints,
                creators: metadataContent.data.creators
            },
            uriData,
            primarySaleHappened: metadataContent.primarySaleHappened,
            isMutable: metadataContent.isMutable,
            editionNonce: metadataContent.editionNonce,
            tokenStandard: metadataContent.tokenStandard,
            collection: metadataContent.collection,
            uses: metadataContent.uses
        };

        return {
            decimals: mintInfo.decimals,
            supply: mintInfo.supply.toString(),
            ...metadata
        };
    } catch (err) {
        console.error("Error: ", err);
        throw Error(err);
    }
};
// fetchMintInfo("AujTJJ7aMS8LDo3bFzoyXDwT3jBALUbu4VZhzZdTZLmG", connection).then(res => console.log(res))

/**
 * Retrieves and processes transaction data related to Raydium accounts on the Solana blockchain.
 * @param {Object} params - The parameters object.
 * @param {string} params.txId - The transaction ID to fetch and process.
 * @param {Connection} params.connection - The Solana blockchain connection object.
 * @returns {Object} - The token information object if a valid token account is found.
 */
const fetchRaydiumAccounts = async ({ txId }) => {
    try {
        const tx = await connection.getParsedTransaction(txId, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        });

        credits += 100;

        const accounts = tx?.transaction.message.instructions.find(ix => ix.programId.toBase58() === RAYDIUM_PUBLIC_KEY)?.accounts;

        if (!accounts) {
            console.log("No accounts found in the transaction.");
            return;
        }

        const tokenAccount = accounts.slice(8, 10).map(acc => acc.toBase58()).find(acc => !excludedPublickKeys.includes(acc));

        if (!tokenAccount) return;

        const tokenInfo = await fetchMintInfo(tokenAccount, connection);

        const displayData = [
            { "Token": "A", "Account Public Key": tokenAccount, "Symbol": tokenInfo.data.symbol, "Name": tokenInfo.data.name, "supply": tokenInfo.supply },
        ];
        console.log("New LP Found");
        console.log(generateSolanaExplorerUrl(txId));
        console.table(displayData);
        console.log("Total QuickNode Credits Used in this session:", credits);
        
        return {
            ...tokenInfo,
            quicknode: credits
        }
    } catch (err) {
        console.error(err);
        throw new Error(err)
    }
}
// fetchRaydiumAccounts({ txId: "26DTobUfiR9T2fNHKCA52d6zoEWd8k7tggat6iacq7zCyPSDBf1ueWyXz1EncxxgYSWpMsp9iCiGcpnjLn5rDTF9", connection}).then(res => console.log(res))

/**
 * Subscribes to logs emitted by a specific Solana program (Raydium) and triggers an action when a specific instruction is detected.
 * @param {Connection} connection - An instance of Solana's Connection class used to interact with the Solana blockchain.
 */
const listen = async () => {
    try {
        const raydiumPublicKey = new PublicKey(RAYDIUM_PUBLIC_KEY);
        console.log(`Subscribing to ${raydiumPublicKey.toString()}...`);

        connection.onLogs(raydiumPublicKey, ({ logs, err, signature }) => {
            if (err) return;

            if (logs && logs.some(log => log.includes(INSTRUCTION_NAME))) {
                console.log(`Signature for ${INSTRUCTION_NAME} event:`, signature);

                addJob({
                    data: { txId: signature },
                    jobName: signature,
                    queueName: "solQueue"
                })
            }
        }, "finalized");
    } catch (err) {
        console.error('Subscription error:', err);
        reconnect();
    }
}

// addJob({
//     data: { txId: "4z7DiC7zLuCjpzbYdzZhxRQm586sLf43gmrGPahkgPrYcowoVTNRuCbdw7rUiSuAxSaCfjewMrL8EgzfxfpyPcX5" },
//     jobName: "4z7DiC7zLuCjpzbYdzZhxRQm586sLf43gmrGPahkgPrYcowoVTNRuCbdw7rUiSuAxSaCfjewMrL8EgzfxfpyPcX5",
//     queueName: "solQueue"
// })

const reconnect = () => {
    if(!SOLANA_LISTENER) return
    console.log('Reconnecting in 5 seconds...');
    setTimeout(() => listen(connection), 5000);
};

// listen(connection)

module.exports = {
    fetchRaydiumAccounts,
    solListener: reconnect
}