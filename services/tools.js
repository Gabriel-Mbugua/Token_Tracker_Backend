const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const cleanString = (str) =>  str.replace(/\x00/g, '').trim();

const generateSolanaExplorerUrl = (txId) => `https://explorer.solana.com/tx/${txId}?cluster=devnet`;


module.exports = {
    delay,
    cleanString,
    generateSolanaExplorerUrl
}