import { EXPLORER_LINK } from "@/constants";
import { Forward, ReturnedCoin, extractForward, extractReturnedCoin, filterUndefinedValues } from "@/utils";
import { JettonOp } from "@/web3/jetton/Constants";
import {
    tonLiteClient
} from "@/web3/ton-connect/ton-lite-client";
import { Address, Cell, Message, Transaction, fromNano, loadTransaction } from "@ton/core";


export interface GasInfo {
    [key: number]: {
        txHash?: string,
        jettonExcess: bigint,
        jettonNotify: bigint,
    }
}

export type TxInfo = {
    txLink: string,
    timestamp: number,
    queryId: number,
    gas: number
}

function setGasInfo(
    info: GasInfo,
    queryId: number,
    txHash?: string,
    returnedCoin?: ReturnedCoin
) {
    if (!info[queryId]) {
        info[queryId] = {
            jettonExcess: 0n,
            jettonNotify: 0n
        }
    }

    if (txHash) info[queryId].txHash = txHash;
    if (returnedCoin) {
        if (returnedCoin.op === JettonOp.excesses) {
            info[queryId].jettonExcess = returnedCoin.amount;
        }
        else if (returnedCoin.op === JettonOp.transfer_notification) {
            info[queryId].jettonNotify = returnedCoin.amount;
        }
    }
}

export async function scanTxs(account: Address, extractor: (msg: Message) => boolean) {
    const gasResults: GasInfo = {};
    let txResults: Transaction[] = [];

    const info = await tonLiteClient.getMasterchainInfo();
    const accountState = await tonLiteClient.getAccountState(account, info.last)
    let lt = accountState.lastTx!.lt.toString();
    let hash = Buffer.from(accountState.lastTx!.hash.toString(16).padStart(64, "0"), "hex");
    for (let i = 0; i < 220; i++) {
        try {
            const txs = await tonLiteClient.getAccountTransactions(account, lt, hash, 16);

            const parsedTxs = Cell.fromBoc(txs.transactions).map(tx => loadTransaction(tx.beginParse()))

            const newTxs = extractTxs(parsedTxs, extractor)
            console.log(newTxs.map(tx => tx.hash().toString('hex')));
            txResults = [...txResults, ...newTxs];

            const txLength = parsedTxs.length;
            if (txLength > 0) {
                const lastTx = parsedTxs[txLength - 1];
                lt = lastTx.lt.toString();
                hash = lastTx.hash();

                const gasInfos = parsedTxs.map(extractGasInfo);

                gasInfos.forEach(({ forwards, returnedCoin, txHash }) => {
                    forwards.forEach(forward => {
                        setGasInfo(gasResults, forward.queryId, txHash)
                    })
                    if (returnedCoin) {
                        setGasInfo(gasResults, returnedCoin.queryId, undefined, returnedCoin)
                    }
                })
            }
            else {
                break;
            }
        } catch (err) {
            console.log(`Error fetching tx: ${(err as Error).message}`)
        }
    }

    const txInfo: TxInfo[] = []
    Object.entries(gasResults).forEach(([k, v]) => {
        const queryId = Number(k);
        const {
            txHash, jettonExcess, jettonNotify
        } = v
        if (txHash) {
            const matchedTx = txResults.find(tx => tx.hash().toString('hex') === txHash);
            if (matchedTx) {
                console.log(txHash, jettonExcess, jettonNotify)
                txInfo.push({
                    queryId,
                    txLink: `${EXPLORER_LINK}${txHash}`,
                    timestamp: matchedTx.now,
                    gas: 0.2 - Number(fromNano(jettonExcess + jettonNotify))
                })
            }
        }
    })
    return txInfo;
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

export function extractGasInfo(tx: Transaction) {
    let returnedCoin: ReturnedCoin | undefined = undefined;
    const inMsg = tx.inMessage;
    if (inMsg) {
        returnedCoin = extractReturnedCoin(inMsg);
    }

    let forwards: Forward[] = [];
    const outMsgs = tx.outMessages.values();
    forwards = filterUndefinedValues(outMsgs.map(extractForward));

    return {
        txHash: tx.hash().toString('hex'),
        returnedCoin,
        forwards
    }
}