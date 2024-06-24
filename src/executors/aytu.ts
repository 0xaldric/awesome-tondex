import { AYTU_MASTER_POOL_WALLET, AYTU_ROUTER_ADDRESS } from "@/constants";
import { Router } from "@/web3/aytu/Router";
import { tonLiteClient } from "@/web3/ton-connect/ton-lite-client";
import { getWallet } from "@/web3/wallet";
import { toNano } from "@ton/core";

export async function aytuBuy(buyAmount = toNano(0.1)) {

    const { keyPair, walletContract } = await getWallet(0);

    const queryId = Date.now();
    const forwardTonAmount = toNano(0.2)

    const routerContract = tonLiteClient.open(Router.createFromAddress(AYTU_ROUTER_ADDRESS));

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

    return queryId;
}