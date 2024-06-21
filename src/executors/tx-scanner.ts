import {
    tonLiteClient
} from "@/web3/ton-connect/ton-lite-client";
import { Address, Cell, Message, Transaction, loadTransaction } from "@ton/core";

export async function scanTxHashes(account: Address, extractor: (msg: Message) => boolean) {
    let txHashes: string[] = [];
    const info = await tonLiteClient.getMasterchainInfo();
    const accountState = await tonLiteClient.getAccountState(account, info.last)
    let lt = accountState.lastTx!.lt.toString();
    let hash = Buffer.from(accountState.lastTx!.hash.toString(16).padStart(64, "0"), "hex");
    for (let i = 0; i < 200; i++) {
        try {
            const txs = await tonLiteClient.getAccountTransactions(account, lt, hash, 16);

            const parsedTxs = Cell.fromBoc(txs.transactions).map(tx => loadTransaction(tx.beginParse()))

            const newTxHashes = extractTxHashes(parsedTxs, extractor)
            console.log(newTxHashes);
            txHashes = [...txHashes, ...newTxHashes];

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

    return Array.from(new Set(txHashes));
}

export function extractTxHashes(txs: Transaction[], extractor: (msg: Message) => boolean): string[] {
    let txHashes = [];
    for (const tx of txs) {
        for (const msg of tx.outMessages.values()) {
            if (extractor(msg)) {
                txHashes.push(tx.hash().toString('hex'));
                break;
            }
        }
    }
    return txHashes;
}