import axios from "axios";
import * as cheerio from "cheerio"
import { chunk } from "lodash";
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import aytuTxs from 'root/aytu-txs.json';
import dedustTxs from 'root/dedust-txs.json';
import stonfiTxs from 'root/stonfi-txs.json';
import { sleep } from "@/utils";
import { TxInfo } from "@/executors/tx-scanner";

type Dex = 'STON.FI' | 'DEDUST' | 'AYTU'
export interface SwapResult {
    dex: Dex,
    txLink: string,
    timestamp: number,
    duration: number,
    gas: number
}

const csvFilePath = path.join(__dirname, '../../results.csv');

function convertToSeconds(duration: string) {
    let totalSeconds = 0;

    // Split the duration string by spaces to handle multiple parts (e.g., "1min: 1s")
    const parts = duration.split(" ");

    parts.forEach((part) => {
        // If the part contains "min:", extract the minutes and seconds
        if (part.includes("min:")) {
            const [min, sec] = part.split("min:");
            totalSeconds += parseInt(min) * 60; // Convert minutes to seconds and add to total
            if (sec) {
                totalSeconds += parseInt(sec); // Add the remaining seconds to total
            }
        } else if (part.includes("s")) {
            // If the part is only seconds
            totalSeconds += parseInt(part);
        }
    });

    return totalSeconds;
}
function appendSwapResults(swapResults: SwapResult[]): void {
    const fileExists = fs.existsSync(csvFilePath);

    const header = 'DEX,Tx Link,Duration,Timestamp,Gas Fee';
    let dataToWrite = '';

    if (!fileExists) {
        dataToWrite += header + os.EOL;
    }

    swapResults.forEach(result => {
        const record = `${result.dex},${result.txLink},${result.duration},${result.timestamp},${result.gas}`;
        dataToWrite += record + os.EOL;
    });

    fs.appendFileSync(csvFilePath, dataToWrite, 'utf8');
    console.log(`Records added: ${swapResults.length}`);
}

async function crawler(dex: Dex, txInfo: TxInfo): Promise<SwapResult | undefined> {
    const response = await axios.get(txInfo.txLink);

    // Load the HTML content into Cheerio
    const $ = cheerio.load(response.data);

    // Use a selector to find the element containing the duration text
    const durationText = $('div:contains("Duration:")').text();

    // Use a regular expression to extract the duration
    const match = durationText.match(/Duration:\s*([\d\smin:]+s)/);

    // Check if a match was found and extract the duration
    if (match && match[1]) {
        const duration = convertToSeconds(match[1]);
        return {
            ...txInfo,
            dex,
            duration,
        };
    } else {
        console.log("Duration not found", txInfo.txLink);
    }
}
const CHUCK_SIZE = 20;


async function fetchDurations(dex: Dex) {

    let txInfos: TxInfo[];
    switch (dex) {
        case "STON.FI": {
            txInfos = stonfiTxs
            break;
        }
        case "DEDUST": {
            txInfos = dedustTxs
            break;
        }
        case "AYTU": {
            txInfos = aytuTxs
            break;
        }
    }

    const chunks = chunk(txInfos, CHUCK_SIZE);
    const start = Date.now();
    console.log("Chunk", txInfos.length, "urls into", chunks.length, "chunks");

    const fulfilled: SwapResult[] = [];

    for (const chunk of chunks) {
        const results = await Promise.allSettled(
            chunk.map((info) => crawler(dex, info).catch(console.error))
        );

        //   save result to result.json
        results.forEach((result) => {
            if (result.status === "fulfilled" && result.value) {
                fulfilled.push(result.value);
            }
        });

        console.log("Crawled chunk", results.length, "urls");
        await sleep(5000);

    }

    console.log(
        "Crawled",
        fulfilled.length,
        "/",
        txInfos.length,
        "urls in",
        (Date.now() - start) / 1000,
        "s"
    );

    appendSwapResults(fulfilled.slice(0, 1000));
};

async function main() {
    await fetchDurations('AYTU');
    await fetchDurations('DEDUST');
    await fetchDurations('STON.FI');
}

main();