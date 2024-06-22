import { isAytuBuy } from "@/executors/aytu";
import { isDeDustBuy } from "@/executors/dedust";
import { isStonFiBuy } from "@/executors/stonfi";
import { scanTxs } from "@/executors/tx-scanner";
import { getWallet } from "@/web3/wallet";
import { Transaction } from "@ton/core";
import { writeFile } from "fs";

const explorerLink = 'https://testnet.tonviewer.com/transaction/'

export type TxInfo = {
    txLink: string,
    timestamp: number
}

function txToTxInfo(tx: Transaction) {
    const hash = tx.hash().toString('hex');
    const txLink = `${explorerLink}${hash}`
    const timestamp = tx.now;

    return {
        txLink, timestamp
    }
}


async function main() {

    const { walletContract: aytuWallet } = await getWallet(0);

    const aytuTxs = await scanTxs(aytuWallet.address, isAytuBuy);

    const aytuTxInfo = aytuTxs.map(txToTxInfo)
    writeFile('aytu-txs.json', JSON.stringify(aytuTxInfo), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to aytu-txs.json');
        }
    })

    const { walletContract: dedustWallet } = await getWallet(1);
    const dedustTxs = await scanTxs(dedustWallet.address, isDeDustBuy);

    const dedustTxInfo = dedustTxs.map(txToTxInfo);

    writeFile('dedust-txs.json', JSON.stringify(dedustTxInfo), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to dedust-txs.json');
        }
    })

    const { walletContract: stonfiWallet } = await getWallet(2);
    const stonfiTxs = await scanTxs(stonfiWallet.address, isStonFiBuy);

    const stonfiTxInfo = stonfiTxs.map(txToTxInfo);

    writeFile('stonfi-txs.json', JSON.stringify(stonfiTxInfo), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to stonfi-txs.json');
        }
    })
}

main();