import {
    tonLiteClient
} from "@/web3/ton-connect/ton-lite-client";
import { Address, Cell, Message, Transaction, loadTransaction } from "@ton/core";

export async function scanTxs(account: Address, extractor: (msg: Message) => boolean) {
    let results: Transaction[] = [];
    const info = await tonLiteClient.getMasterchainInfo();
    const accountState = await tonLiteClient.getAccountState(account, info.last)
    let lt = accountState.lastTx!.lt.toString();
    let hash = Buffer.from(accountState.lastTx!.hash.toString(16).padStart(64, "0"), "hex");
    for (let i = 0; i < 200; i++) {
        try {
            const txs = await tonLiteClient.getAccountTransactions(account, lt, hash, 16);

            const parsedTxs = Cell.fromBoc(txs.transactions).map(tx => loadTransaction(tx.beginParse()))

            const newTxs = extractTxs(parsedTxs, extractor)
            console.log(newTxs.map(tx => tx.hash().toString('hex')));
            results = [...results, ...newTxs];

            const txLength = parsedTxs.length;
            if (txLength > 0) {
                const lastTx = parsedTxs[txLength - 1];
                lt = lastTx.lt.toString();
                hash = lastTx.hash();
            }
            else {
                break;
            }
        } catch (err) {
            console.log(`Error fetching tx: ${(err as Error).message}`)
        }
    }

    return results;
}

export function extractTxs(txs: Transaction[], extractor: (msg: Message) => boolean): Transaction[] {
    let results = [];
    for (const tx of txs) {
        for (const msg of tx.outMessages.values()) {
            if (extractor(msg)) {
                results.push(tx);
                break;
            }
        }
    }
    return results;
}