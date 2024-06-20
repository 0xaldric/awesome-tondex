import { Sha256 } from "@aws-crypto/sha256-js";
import { type Address, BitBuilder, type BitString, type Slice, type TonClient, beginCell } from "@ton/ton";
import { sleep } from "@/utils";

export const SNAKE_PREFIX = 0x00;
export const ONCHAIN_CONTENT_PREFIX = 0x00;
export const OFFCHAIN_CONTENT_PREFIX = 0x01;
export type JettonMetaDataKeys = "name" | "description" | "image" | "symbol" | "image_data" | "decimals";

export const sha256 = (str: string) => {
    const sha = new Sha256();
    sha.update(str);
    return Buffer.from(sha.digestSync());
};

export async function waitForContractDeploy(address: Address, client: TonClient) {
    let isDeployed = false;
    let maxTries = 25;
    while (maxTries > 0) {
        maxTries--;
        isDeployed = await client.isContractDeployed(address);
        if (isDeployed) return;
        await sleep(1000);
    }
    throw new Error("Timeout");
}

function bufferToChunks(buff: Buffer, chunkSize: number) {
    const chunks: Buffer[] = [];
    while (buff.byteLength > 0) {
        chunks.push(buff.slice(0, chunkSize));
        buff = buff.slice(chunkSize);
    }
    return chunks;
}

export function makeSnakeCell(data: Buffer) {
    // Create a cell that package the data
    const CELL_MAX_SIZE_BYTES = Math.floor((1023 - 8) / 8);
    const chunks = bufferToChunks(data, CELL_MAX_SIZE_BYTES);

    const b = chunks.reduceRight((curCell, chunk, index) => {
        if (index === 0) {
            curCell.storeInt(SNAKE_PREFIX, 8);
        }
        curCell.storeBuffer(chunk);
        if (index > 0) {
            const cell = curCell.endCell();
            return beginCell().storeRef(cell);
        }
        return curCell;
    }, beginCell());
    return b.endCell();
}

export const toKey = (key: string) => {
    return BigInt(`0x${sha256(key).toString("hex")}`);
};

export function bitsToPaddedBuffer(bits: BitString) {
    // Create builder
    const builder = new BitBuilder(Math.ceil(bits.length / 8) * 8);
    builder.writeBits(bits);

    // Apply padding
    const padding = Math.ceil(bits.length / 8) * 8 - bits.length;
    for (let i = 0; i < padding; i++) {
        if (i === 0) {
            builder.writeBit(1);
        } else {
            builder.writeBit(0);
        }
    }

    return builder.buffer();
}

function readUnaryLength(slice: Slice) {
    let res = 0;
    while (slice.loadBit()) {
        res++;
    }
    return res;
}

function doParse<V>(prefix: string, slice: Slice, n: number, res: Map<bigint, V>, extractor: (src: Slice) => V) {
    // Reading label
    const lb0 = slice.loadBit() ? 1 : 0;
    let prefixLength = 0;
    let pp = prefix;

    if (lb0 === 0) {
        // Short label detected

        // Read
        prefixLength = readUnaryLength(slice);

        // Read prefix
        for (let i = 0; i < prefixLength; i++) {
            pp += slice.loadBit() ? "1" : "0";
        }
    } else {
        const lb1 = slice.loadBit() ? 1 : 0;
        if (lb1 === 0) {
            // Long label detected
            prefixLength = slice.loadUint(Math.ceil(Math.log2(n + 1)));
            for (let i = 0; i < prefixLength; i++) {
                pp += slice.loadBit() ? "1" : "0";
            }
        } else {
            // Same label detected
            const bit = slice.loadBit() ? "1" : "0";
            prefixLength = slice.loadUint(Math.ceil(Math.log2(n + 1)));
            for (let i = 0; i < prefixLength; i++) {
                pp += bit;
            }
        }
    }

    if (n - prefixLength === 0) {
        res.set(BigInt("0b" + pp), extractor(slice));
    } else {
        const left = slice.loadRef();
        const right = slice.loadRef();
        // NOTE: Left and right branches are implicitly contain prefixes '0' and '1'
        if (!left.isExotic) {
            doParse(pp + "0", left.beginParse(), n - prefixLength - 1, res, extractor);
        }
        if (!right.isExotic) {
            doParse(pp + "1", right.beginParse(), n - prefixLength - 1, res, extractor);
        }
    }
}

export function parseDict<V>(sc: Slice | null, keySize: number, extractor: (src: Slice) => V) {
    const res: Map<bigint, V> = new Map();
    if (sc) {
        doParse("", sc, keySize, res, extractor);
    }
    return res;
}
