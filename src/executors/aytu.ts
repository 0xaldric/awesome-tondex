import { AYTU_MASTER_POOL_WALLET, AYTU_ROUTER_ADDRESS } from "@/constants";
import { AytuRouterOp } from "@/web3/aytu/Constants";
import { Router } from "@/web3/aytu/Router";
import { tonLiteClient } from "@/web3/ton-connect/ton-lite-client";
import { getWallet } from "@/web3/wallet";
import { Address, Message, toNano } from "@ton/core";

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

export function isAytuBuy(msg: Message): boolean {
    try {
        const msgDest = msg.info.dest;
        if (!msgDest) return false;

        const destAddress = Address.parse(msgDest.toString());
        if (!destAddress.equals(AYTU_ROUTER_ADDRESS)) return false;

        const body = msg.body.beginParse();
        const op = body.loadUint(32);
        if (op === AytuRouterOp.swap_ton_for_jetton) {
            return true;
        }
    } catch (err) {
        return false;
    }
    return false;
}