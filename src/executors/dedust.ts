import { DEDUST_NATIVE_VAULT_ADDRESS, DEDUST_QUOTE_POOL_ADDRESS } from "@/constants";
import { SwapToJettonParams, VaultNative } from "@/web3/dedust/vault";
import { getWallet } from "@/web3/wallet";
import { internal, toNano } from "@ton/core";

export async function dedustBuy(buyAmount = toNano(0.1)) {

    const { keyPair, walletContract } = await getWallet();

    const queryId = Date.now();
    const forwardTonAmount = toNano(0.1)

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
}