import { DEDUST_NATIVE_VAULT_ADDRESS, DEDUST_QUOTE_POOL_ADDRESS } from "@/constants";
import { SwapToJettonParams, VaultNative } from "@/web3/dedust/vault";
import { getWallet } from "@/web3/wallet";
import { Address, Message, internal, toNano } from "@ton/core";

export async function dedustBuy(buyAmount = toNano(0.1)) {

    const { keyPair, walletContract } = await getWallet(1);

    const queryId = Date.now();
    const forwardTonAmount = toNano(0.2)

    const swapParams: SwapToJettonParams = {
        queryId,
        amount: buyAmount,
        poolAddress: DEDUST_QUOTE_POOL_ADDRESS
    };

    const swapMessage = VaultNative.swapMessage(swapParams);
    const seqno = await walletContract.getSeqno();

    const message = internal({
        value: buyAmount + forwardTonAmount,
        to: DEDUST_NATIVE_VAULT_ADDRESS,
        bounce: false,
        init: walletContract.init,
        body: swapMessage
    })

    await walletContract.sendTransfer({
        seqno,
        secretKey: keyPair.secretKey,
        messages: [message]
    });

    console.log('DeDust buy sent!')

    return queryId
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