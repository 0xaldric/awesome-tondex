import { STONFI_QUOTE_WALLET_ADDRESS, STONFI_ROUTER_ADDRESS, STONFI_TON_WALLET_ADDRESS } from "@/constants";
import { JettonWallet, TransferMessageParams } from "@/web3/jetton/JettonWallet";
import { StonFiOp } from "@/web3/stonfi/Constants";
import { getWallet } from "@/web3/wallet";
import { beginCell, internal, toNano } from "@ton/core";
import { scanTx } from "./tx-scanner";

export async function stonfiBuy(buyAmount = toNano(0.1)) {

    const { keyPair, walletContract } = await getWallet();

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

    return await scanTx(walletContract.address, queryId);
}