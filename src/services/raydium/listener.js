import axios from "axios";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { Metadata, PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { config } from "../../config/config.js";
import { addDocument } from "../../database/operations.js";
import { addJob } from "../../messageQueue/queue.js";
import { commonUtils } from "../../utils/index.js";
// import { logger } from "../../utils/console.js";

class RaydiumListener {
    constructor() {
        this.connection = new Connection(config.solana.httpUrl, {
            wsEndpoint: config.solana.wsUrl,
        });
        this.isConnected = false;
        this.retryCount = 0;
        this.maxRetries = 5;
    }

    async fetchUriData(uri) {
        try {
            const response = await axios.get(uri, { timeout: 5000 });
            return response.data;
        } catch (err) {
            console.error(`Error fetching URI data: ${uri}`, err.message);
            return null;
        }
    }

    async analyzeTokenRisk(metadata, mintInfo) {
        const risks = [];

        // 1. Check metadata completeness
        if (!metadata.data.name || !metadata.data.symbol || !metadata.data.uri) {
            risks.push("Missing basic metadata");
        }

        // 2. Check supply and decimals
        if (mintInfo.supply > BigInt("1000000000000000000")) {
            // Extremely large supply
            risks.push("Unusually large supply");
        }
        if (mintInfo.decimals > 9) {
            risks.push("Unusual number of decimals");
        }

        // 3. Check metadata URI
        if (metadata.data.uri) {
            if (!metadata.data.uri.startsWith("https://")) {
                risks.push("Non-HTTPS metadata URI");
            }
            if (metadata.data.uri.includes("bit.ly") || metadata.data.uri.includes("tinyurl")) {
                risks.push("Suspicious URL shortener in metadata");
            }
        }

        // 4. Check for verified creators
        if (!metadata.data.creators || metadata.data.creators.length === 0) {
            risks.push("No verified creators");
        }

        // 5. Check for suspicious names/symbols
        const suspiciousPatterns = [
            "free",
            "airdrop",
            "elon",
            "moon",
            "safe",
            "gem",
            "profit",
            "rich",
            "quick",
            "1000x",
            "100x",
            "presale",
        ];

        const name = metadata.data.name.toLowerCase();
        const symbol = metadata.data.symbol.toLowerCase();

        suspiciousPatterns.forEach((pattern) => {
            if (name.includes(pattern) || symbol.includes(pattern)) {
                risks.push(`Suspicious name pattern: ${pattern}`);
            }
        });

        return {
            supply: mintInfo.supply.toString(),
            decimals: mintInfo.decimals,
            risks: risks,
            riskLevel: risks.length > 2 ? "HIGH" : risks.length > 0 ? "MEDIUM" : "LOW",
        };
    }

    cleanData(data) {
        const cleaned = { ...data };

        // Convert creators array
        if (cleaned.creators) {
            cleaned.creators = cleaned.creators.map((creator) => ({
                address: creator.address._bn ? new PublicKey(creator.address._bn).toString() : creator.address,
                verified: creator.verified,
                share: creator.share,
            }));
        }

        // Convert snake_case to camelCase and ensure JSON fields are proper objects
        const processedData = {
            decimals: cleaned.decimals,
            supply: cleaned.supply,
            mint_address: cleaned.mint_address,
            token_standard: cleaned.token_standard,
            update_authority: cleaned.update_authority,
            name: cleaned.name,
            symbol: cleaned.symbol,
            uri: cleaned.uri,
            creators: cleaned.creators ? JSON.stringify(cleaned.creators) : null,
            authorities: cleaned.authorities
                ? JSON.stringify({
                      mint: cleaned.authorities.mint || null,
                      freeze: cleaned.authorities.freeze || null,
                      update: cleaned.authorities.update || null,
                  })
                : null,
            flags: cleaned.flags
                ? JSON.stringify({
                      isMutable: cleaned.flags.is_mutable,
                      primarySaleHappened: cleaned.flags.primary_sale_happened,
                  })
                : null,
            risk_analysis: cleaned.risk_analysis
                ? JSON.stringify({
                      supply: cleaned.risk_analysis.supply,
                      decimals: cleaned.risk_analysis.decimals,
                      risks: cleaned.risk_analysis.risks,
                      riskLevel: cleaned.risk_analysis.riskLevel,
                  })
                : null,
            uri_data: cleaned.uri_data ? JSON.stringify(cleaned.uri_data) : null,
            address: cleaned.address,
            network: cleaned.network,
            transaction_id: cleaned.transaction_id,
        };

        // Remove null/undefined values
        return Object.fromEntries(Object.entries(processedData).filter(([_, v]) => v != null));
    }

    async fetchMintInfo(mintAddressStr) {
        try {
            const mintAddress = new PublicKey(mintAddressStr);
            const mintInfo = await getMint(this.connection, mintAddress);
            const [metadataPda] = PublicKey.findProgramAddressSync(
                [Buffer.from("metadata"), new PublicKey(PROGRAM_ID).toBuffer(), mintAddress.toBuffer()],
                PROGRAM_ID
            );
            const metadataContent = await Metadata.fromAccountAddress(this.connection, metadataPda);

            const riskAnalysis = await this.analyzeTokenRisk(metadataContent, mintInfo);

            const uriData = metadataContent?.data?.uri ? await this.fetchUriData(metadataContent.data.uri) : null;

            const mintAuthority = mintInfo.mintAuthority?.toString();
            const freezeAuthority = mintInfo.freezeAuthority?.toString();

            const tokenInfo = {
                decimals: mintInfo.decimals,
                supply: mintInfo.supply.toString(),
                mint_address: new PublicKey(metadataContent.mint).toBase58(),
                token_standard: metadataContent.tokenStandard,
                update_authority: new PublicKey(metadataContent.updateAuthority).toBase58(), // The public key that can update this metadata
                name: metadataContent.data?.name?.replace(/\u0000/g, "").trim() || null,
                symbol: metadataContent.data?.symbol?.replace(/\u0000/g, "").trim() || null,
                uri: metadataContent.data?.uri?.replace(/\u0000/g, "").trim() || null,
                creators: metadataContent.data?.creators,
                authorities: {
                    mint: mintAuthority,
                    freeze: freezeAuthority,
                    update: new PublicKey(metadataContent.updateAuthority).toBase58(),
                },
                flags: {
                    is_mutable: metadataContent.isMutable,
                    primary_sale_happened: metadataContent.primarySaleHappened,
                },
                risk_analysis: riskAnalysis,
                uri_data: uriData,
            };

            const cleanedData = this.cleanData(tokenInfo);

            return cleanedData;
        } catch (err) {
            console.error(`Error fetching mint info: ${mintAddressStr}`, err);
            throw err;
        }
    }

    async processTransaction(txId) {
        try {
            const tx = await this.connection.getParsedTransaction(txId, {
                maxSupportedTransactionVersion: 0,
                commitment: "confirmed",
            });

            const accounts = tx?.transaction.message.instructions.find(
                (ix) => ix.programId.toBase58() === config.solana.raydiumPublicKey
            )?.accounts;

            if (!accounts) {
                console.debug("No relevant accounts found in transaction");
                return null;
            }

            const tokenAccount = accounts
                .slice(8, 10)
                .map((acc) => acc.toBase58())
                .find((acc) => config.solana.excludedPublickKeys !== acc);

            if (!tokenAccount) return null;

            const tokenInfo = await this.fetchMintInfo(tokenAccount);

            console.info(`New token found: ${tokenInfo?.name || "MISSING"}`);

            const id = commonUtils.getUniqueId();

            return await addDocument({
                table: "tokens",
                id,
                data: {
                    ...tokenInfo,
                    address: tokenAccount,
                    network: "solana",
                    transaction_id: txId,
                },
            });
        } catch (err) {
            console.error(`Error processing transaction: ${txId}`, err);
            throw err;
        }
    }

    async start() {
        try {
            const raydiumPublicKey = new PublicKey(config.solana.raydiumPublicKey);
            console.info(`Starting Raydium listener for ${raydiumPublicKey.toString()}`);

            this.connection.onLogs(raydiumPublicKey, async ({ logs, err, signature }) => {
                if (err) return;

                const isSuccessfulMint = logs?.some(
                    (log) =>
                        log.includes(config.solana.instructionName) &&
                        !log.includes("Error:") &&
                        logs[logs.length - 1].includes("success")
                );

                if (!isSuccessfulMint) return;

                try {
                    console.info(`New successful mint detected: ${signature}`);

                    await addJob({
                        queueName: "solQueue",
                        jobName: signature,
                        data: { txId: signature },
                    });
                    console.log(`Added job to solQueue: ${signature}`);
                } catch (err) {
                    console.error(`Error adding job to solQueue: ${signature}`, err);
                }
            });

            this.isConnected = true;
            this.retryCount = 0;
        } catch (err) {
            console.error("Listener error:", err);
            await this.reconnect();
        }
    }

    async processQueuedTransaction(data) {
        try {
            const { txId } = data;
            const result = await this.processTransaction(txId);
            return result;
        } catch (err) {
            console.error(`Error processing transaction: ${data.txId}`, err);
            throw err;
        }
    }

    async reconnect() {
        if (this.retryCount >= this.maxRetries) {
            console.error("Max reconnection attempts reached");
            process.exit(1);
        }

        this.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 30000);

        console.info(`Attempting reconnection in ${delay / 1000} seconds...`);
        setTimeout(() => this.start(), delay);
    }

    async stop() {
        this.isConnected = false;
    }
}

export const raydiumListener = new RaydiumListener();

export const processRaydiumTokenJob = async (data) => {
    return await raydiumListener.processQueuedTransaction(data);
};

// processRaydiumTokenJob({
//     //     txId: "294eJsLoidJfaH5GA43hbDGH9KYiCsob6CiQr99wTigQmYBVgBgbAaaifkARJ4KrkZdErrLNtuGpasAvkCMdoDKP",
// txId: "4GwNf56tdZcKn8ZswMfpSn9cud2Yb6GFpDmuhSae7Uo6VB1XXFnbdTKt5oxw7DDgHBsM129BJC6EeJjv2vayfY97",
// txId: "26uvWwkJ8o4mV7JWkHwuPY1Y12UhoS5KETV5JzSRSQj1mD1HWqrpdMfJ7JWBfXAY9G4EFuPGPTCPY16BVG1f4Viv",
// });
