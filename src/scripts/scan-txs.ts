import { scanTxs } from "@/executors/tx-scanner";
import { isAytuBuy, isDeDustBuy, isStonFiBuy } from "@/utils";
import { getWallet } from "@/web3/wallet";
import { writeFile } from "fs";

async function main() {

    const { walletContract: aytuWallet } = await getWallet(0);

    const aytuTxInfo = await scanTxs(aytuWallet.address, isAytuBuy);

    writeFile('aytu-txs.json', JSON.stringify(aytuTxInfo), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to aytu-txs.json');
        }
    })

    const { walletContract: dedustWallet } = await getWallet(1);
    const dedustTxInfo = await scanTxs(dedustWallet.address, isDeDustBuy);

    writeFile('dedust-txs.json', JSON.stringify(dedustTxInfo), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to dedust-txs.json');
        }
    })

    const { walletContract: stonfiWallet } = await getWallet(2);
    const stonfiTxInfo = await scanTxs(stonfiWallet.address, isStonFiBuy);

    writeFile('stonfi-txs.json', JSON.stringify(stonfiTxInfo), (err) => {
        if (err) {
            console.error('Error writing to file', err);
        } else {
            console.log('Successfully wrote to stonfi-txs.json');
        }
    })
}

main();