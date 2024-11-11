import { nanoid } from "nanoid";

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const cleanString = (str) => str.replace(/\x00/g, "").trim();

export const generateSolanaExplorerUrl = (txId) => `https://explorer.solana.com/tx/${txId}?cluster=devnet`;

export const getUniqueId = (length = 12) => nanoid(length);
