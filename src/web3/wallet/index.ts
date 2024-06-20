import { env } from "@/config";
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import tonHttpClient from "@/web3/ton-connect/http-client";

const mnemonic: string[] = env.walletMnemonic.split(':');

export async function getWallet() {
    const keyPair = await mnemonicToWalletKey(mnemonic);
    const walletContract = tonHttpClient.open(WalletContractV4.create({
        publicKey: keyPair.publicKey,
        workchain: 0
    }))

    return { keyPair, walletContract }
} 