import { STONFI_QUOTE_WALLET_ADDRESS, STONFI_ROUTER_ADDRESS, STONFI_TON_WALLET_ADDRESS } from "@/constants";
import { JettonOp } from "@/web3/jetton/Constants";
import { JettonWallet, TransferMessageParams } from "@/web3/jetton/JettonWallet";
import { StonFiOp } from "@/web3/stonfi/Constants";
import { getWallet } from "@/web3/wallet";
import { Address, Message, beginCell, internal, toNano } from "@ton/core";

export async function stonfiBuy(buyAmount = toNano(0.1)) {

    const { keyPair, walletContract } = await getWallet(2);

    const queryId = Date.now();
    const forwardTonAmount = toNano(0.2)

    const forwardPayload = beginCell()
        .storeUint(StonFiOp.swap, 32)
        .storeAddress(STONFI_QUOTE_WALLET_ADDRESS)
        // TO-DO: handle slippage
        .storeCoins(0)
        .storeAddress(walletContract.address)
        .storeBit(false)
        .endCell();

    const transferMessageParams: TransferMessageParams = {
        queryId,
        recipient: STONFI_ROUTER_ADDRESS,
        transferAmount: buyAmount,
        forwardPayload,
        forwardTonAmount,
        customPayload: null,
        responseAddress: null
    };

    const transferMessage = JettonWallet.transferMessage(transferMessageParams);
    const seqno = await walletContract.getSeqno();

    const message = internal({
        value: buyAmount + forwardTonAmount,
        to: STONFI_TON_WALLET_ADDRESS,
        bounce: false,
        init: walletContract.init,
        body: transferMessage
    })

    await walletContract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [message]
    });

    console.log('Ston.fi buy sent!')

    return queryId;
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