import { AYTU_MASTER_POOL_WALLET, AYTU_ROUTER_ADDRESS, DEDUST_NATIVE_VAULT_ADDRESS, DEDUST_QUOTE_POOL_ADDRESS } from "@/constants";
import { Router } from "@/web3/aytu/Router";
import { SwapToJettonParams, VaultNative } from "@/web3/dedust/vault";
import tonHttpClient from "@/web3/ton-connect/http-client";
import { getWallet } from "@/web3/wallet";
import { toNano } from "@ton/core";
import { scanTx } from "./tx-scanner";

export async function aytuBuy(buyAmount = toNano(0.1)) {

    const { keyPair, walletContract } = await getWallet();

    const queryId = Date.now();
    const forwardTonAmount = toNano(0.1)

    const routerContract = tonHttpClient.open(Router.createFromAddress(AYTU_ROUTER_ADDRESS));

    await routerContract.sendSwapTonForJetton(
        walletContract.sender(keyPair.secretKey),
        buyAmount + forwardTonAmount,
        buyAmount,
        AYTU_MASTER_POOL_WALLET,
        toNano(0),
        walletContract.address,
        0,
        null,
        queryId
    )

    console.log('Aytu buy sent!')
    return await scanTx(walletContract.address, queryId);
}