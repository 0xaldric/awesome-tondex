import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface SwapResult{
    dex: 'STON.FI' | 'DEDUST' | 'AYTU',
    txHash: string
}

const csvFilePath = path.join(__dirname, '../../swapResults.csv');

export function appendSwapResults(swapResults: SwapResult[]): void {
    const fileExists = fs.existsSync(csvFilePath);

    const header = 'dex,txHash';
    let dataToWrite = '';

    if (!fileExists) {
        dataToWrite += header + os.EOL;
    }

    swapResults.forEach(result => {
        const record = `${result.dex},${result.txHash}`;
        dataToWrite += record + os.EOL;
    });

    fs.appendFileSync(csvFilePath, dataToWrite, 'utf8');
    console.log(`Records added: ${swapResults.length}`);
}