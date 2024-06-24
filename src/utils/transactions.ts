import { AYTU_ROUTER_ADDRESS, DEDUST_NATIVE_VAULT_ADDRESS, STONFI_ROUTER_ADDRESS, STONFI_TON_WALLET_ADDRESS } from "@/constants";
import { AytuRouterOp } from "@/web3/aytu/Constants";
import { JettonOp } from "@/web3/jetton/Constants";
import { StonFiOp } from "@/web3/stonfi/Constants";
import { VaultNative } from "@dedust/sdk";
import { Address, CommonMessageInfoInternal, Message } from "@ton/core";

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

export function isDeDustBuy(msg: Message): boolean {
    try {
        const msgDest = msg.info.dest;
        if (!msgDest) return false;

        const destAddress = Address.parse(msgDest.toString());
        if (!destAddress.equals(DEDUST_NATIVE_VAULT_ADDRESS)) return false;

        const body = msg.body.beginParse();
        const op = body.loadUint(32);
        if (op === VaultNative.SWAP) {
            return true;
        }
    } catch (err) {
        return false;
    }
    return false;
}

export function isStonFiBuy(msg: Message): boolean {
    try {
        const msgDest = msg.info.dest;
        if (!msgDest) return false;

        const destAddress = Address.parse(msgDest.toString());
        if (!destAddress.equals(STONFI_TON_WALLET_ADDRESS)) return false;

        const slice = msg.body.beginParse();
        const op = slice.loadUint(32);
        if (op === JettonOp.transfer) {
            slice.loadUint(64); // queryId
            slice.loadCoins(); // amount
            const destination = slice.loadAddress(); // destination
            if (!destination.equals(STONFI_ROUTER_ADDRESS)) return false;

            // load response destination
            slice.loadMaybeAddress();
            // load custom payload
            slice.loadMaybeRef();
            // load forward amount
            slice.loadCoins();

            const forwardPayload = slice.loadMaybeRef();

            if (forwardPayload !== null) {
                const slice = forwardPayload.beginParse();
                const fwOpCode = slice.loadUint(32);

                if (fwOpCode == StonFiOp.swap) {
                    return true
                }
            }
        }
    } catch (err) {
        return false;
    }
    return false;
}

export type ReturnedCoin = {
    op: number;
    queryId: number;
    amount: bigint;
}

export function extractReturnedCoin(msg: Message) {
    if (msg.info.type !== 'internal') return undefined;
    try {
        const body = msg.body.beginParse();
        const op = body.loadUint(32);
        if (op !== JettonOp.excesses && op !== JettonOp.transfer_notification) return undefined;
        const queryId = body.loadUint(64);
        const amount = (msg.info as CommonMessageInfoInternal).value.coins
        return { queryId, amount, op }
    } catch (err) {
        return undefined;
    }
}

export type Forward = {
    queryId: number;
}

export function extractForward(msg: Message) {
    if (msg.info.type !== 'internal') return undefined;
    try {
        const body = msg.body.beginParse();
        body.loadUint(32);
        const queryId = body.loadUint(64);
        return { queryId }
    } catch (err) {
        return undefined;
    }
}