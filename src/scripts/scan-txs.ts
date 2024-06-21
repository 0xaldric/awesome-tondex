import { isAytuBuy } from "@/executors/aytu";
import { isDeDustBuy } from "@/executors/dedust";
import { isStonFiBuy } from "@/executors/stonfi";
import { scanTxHashes } from "@/executors/tx-scanner";
import { getWallet } from "@/web3/wallet";
import { writeFile } from "fs";

async function main() {
    const explorerLink = 'https://testnet.tonviewer.com/transaction/'
    const { walletContract: aytuWallet } = await getWallet(0);

    const aytuTxHashes = await scanTxHashes(aytuWallet.address, isAytuBuy);
    console.log(aytuTxHashes.length)

    const aytuTxLinks = aytuTxHashes.map(hash => `${explorerLink}${hash}`)
    writeFile('aytu-txs.json', JSON.stringify(aytuTxLinks), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to aytu-txs.json');
        }
    })

    const { walletContract: dedustWallet } = await getWallet(1);
    const dedustTxHashes = await scanTxHashes(dedustWallet.address, isDeDustBuy);
    console.log(dedustTxHashes.length)

    const dedustTxLinks = dedustTxHashes.map(hash => `${explorerLink}${hash}`)
    writeFile('dedust-txs.json', JSON.stringify(dedustTxLinks), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to dedust-txs.json');
        }
    })

    const { walletContract: stonfiWallet } = await getWallet(2);
    const stonfiTxHashes = await scanTxHashes(stonfiWallet.address, isStonFiBuy);
    console.log(stonfiTxHashes.length)

    const stonfiTxLinks = stonfiTxHashes.map(hash => `${explorerLink}${hash}`)
    writeFile('stonfi-txs.json', JSON.stringify(stonfiTxLinks), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to stonfi-txs.json');
        }
    })
}

main();