import { aytuBuy } from "./executors/aytu";
import { dedustBuy } from "./executors/dedust";
import { SwapResult, appendSwapResults } from "./executors/results";
import { stonfiBuy } from "./executors/stonfi";

async function main() {
    const rounds = 1000;
    let swapResults: SwapResult[] = []

    for (let i = 0; i < rounds; i++) {
        const aytuTxHash = await aytuBuy();
        console.log('Aytu Txhash: ', aytuTxHash);

        if (aytuTxHash) {
            swapResults.push({
                dex: 'AYTU',
                txHash: aytuTxHash
            })
        }

        const dedustTxHash = await dedustBuy();
        console.log('DeDust Txhash: ', dedustTxHash);

        if (dedustTxHash) {
            swapResults.push({
                dex: 'DEDUST',
                txHash: dedustTxHash
            })
        }

        const stonfiTxHash = await stonfiBuy();
        console.log('Stonfi Txhash: ', stonfiTxHash);

        if (stonfiTxHash) {
            swapResults.push({
                dex: 'STON.FI',
                txHash: stonfiTxHash
            })
        }
    }

    appendSwapResults(swapResults)
}

main();