import { Address, Cell, beginCell, storeStateInit } from "@ton/core";

export function calculateUserJettonWalletAddress(
    jetton: Address,
    jettonWalletCodeRaw: string,
    user: Address,
) {

    const jettonWalletCode = Cell.fromBoc(Buffer.from(
        jettonWalletCodeRaw,
        'hex'
    ))[0]
    const stateInit = beginCell().store(storeStateInit({
        code: jettonWalletCode,
        data: beginCell()
            .storeCoins(0)
            .storeAddress(user)
            .storeAddress(jetton)
            .storeRef(jettonWalletCode)
            .endCell()
    })).endCell();

    return new Address(0, stateInit.hash())
}