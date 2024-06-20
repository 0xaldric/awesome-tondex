import { sleep } from "@/utils";
import tonHttpClient from "@/web3/ton-connect/http-client";
import { Address, Transaction } from "@ton/core";

const BLOCK_TIME = 3000;
const MAX_ATTEMPS = 50;
export async function scanTx(account: Address, queryId: number) {
    let trial = 0;
    while (trial < MAX_ATTEMPS) {
        const tx = (await tonHttpClient.getTransactions(account, { limit: 1 })).at(0)
        if (tx) {
            const txHash = processTx(tx, queryId);
            if (txHash) {
                return txHash;
            }
        }
        trial++;
        await sleep(BLOCK_TIME);
    }
    return undefined;
}

export function processTx(tx: Transaction, expectedQueryId: number) {
    const outMsgs = tx.outMessages.values();
    for (const msg of outMsgs) {
        try {
            const body = msg.body.beginParse();
            const queryId = body.loadUint(64);
            if (queryId === expectedQueryId) {
                return tx.hash().toString("hex");
            }
        } catch (err) {

        }
    }
    return undefined;
}