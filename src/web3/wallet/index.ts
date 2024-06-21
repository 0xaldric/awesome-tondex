import { env } from "@/config";
import { mnemonicToWalletKey } from "@ton/crypto";
import { WalletContractV4 } from "@ton/ton";
import { tonLiteClient } from "@/web3/ton-connect/ton-lite-client";

export async function getWallet(index: number) {
    const mnemonic = env.walletMnemonic[index].split(' ')
    const keyPair = await mnemonicToWalletKey(mnemonic);
    const walletContract = tonLiteClient.open(WalletContractV4.create({
        publicKey: keyPair.publicKey,
        workchain: 0
    }))

    return { keyPair, walletContract }
} 