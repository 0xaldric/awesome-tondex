import { aytuBuy } from "../executors/aytu";
import { dedustBuy } from "../executors/dedust";
import { stonfiBuy } from "../executors/stonfi";
import { sleep } from "../utils";

async function main() {

    const rounds = 1000;

    for (let i = 0; i < rounds; i++) {
        console.log(`----- Round ${i + 1} -----`)
        try {
            await aytuBuy();
            await dedustBuy();
            await stonfiBuy();
        } catch (err) {
            console.log(err)
        }

        await sleep(10000);
    }
}

main();