import { Address, beginCell, Cell, Contract, ContractProvider, Sender, SendMode, toNano } from "@ton/core";

export interface TransferMessageParams {
    queryId: number;
    transferAmount: bigint;
    recipient: Address;
    forwardTonAmount: bigint;
    responseAddress: Address | null;
    customPayload: Cell | null;
    forwardPayload: Cell | null;
}
interface WalletData {
    balance: bigint;
    owner: Address;
    jetton: Address;
}

export function jettonWalletConfigToCell(): Cell {
    return beginCell().endCell();
}

export class JettonWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new JettonWallet(address);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    async getJettonBalance(provider: ContractProvider) {
        const res = await provider.get("get_wallet_data", []);
        return res.stack.readBigNumber();
    }

    async getWalletData(provider: ContractProvider): Promise<WalletData> {
        const res = await provider.get("get_wallet_data", []);
        const balance = res.stack.readBigNumber();
        const owner = res.stack.readAddress();
        const jetton = res.stack.readAddress();
        return {
            balance,
            owner,
            jetton
        };
    }
    static transferMessage({
        queryId,
        transferAmount,
        recipient,
        responseAddress,
        customPayload,
        forwardTonAmount,
        forwardPayload
    }: TransferMessageParams) {
        return beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(queryId, 64) // op, queryId
            .storeCoins(transferAmount)
            .storeAddress(recipient)
            .storeAddress(responseAddress)
            .storeMaybeRef(customPayload)
            .storeCoins(forwardTonAmount)
            .storeMaybeRef(forwardPayload)
            .endCell();
    }
    async sendTransfer(provider: ContractProvider, via: Sender, value: bigint, params: TransferMessageParams) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.transferMessage(params),
            value: value
        });
    }
    /*
      burn#595f07bc query_id:uint64 amount:(VarUInteger 16)
                    response_destination:MsgAddress custom_payload:(Maybe ^Cell)
                    = InternalMsgBody;
    */
    static burnMessage(jetton_amount: bigint, responseAddress: Address, customPayload: Cell | null) {
        return beginCell()
            .storeUint(0x595f07bc, 32)
            .storeUint(0, 64) // op, queryId
            .storeCoins(jetton_amount)
            .storeAddress(responseAddress)
            .storeMaybeRef(customPayload)
            .endCell();
    }

    async sendBurn(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jetton_amount: bigint,
        responseAddress: Address,
        customPayload: Cell
    ) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.burnMessage(jetton_amount, responseAddress, customPayload),
            value: value
        });
    }
    /*
      withdraw_tons#107c49ef query_id:uint64 = InternalMsgBody;
    */
    static withdrawTonsMessage() {
        return beginCell()
            .storeUint(0x6d8e5e3c, 32)
            .storeUint(0, 64) // op, queryId
            .endCell();
    }

    async sendWithdrawTons(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.withdrawTonsMessage(),
            value: toNano("0.1")
        });
    }
    /*
      withdraw_jettons#10 query_id:uint64 wallet:MsgAddressInt amount:Coins = InternalMsgBody;
    */
    static withdrawJettonsMessage(from: Address, amount: bigint) {
        return beginCell()
            .storeUint(0x768a50b2, 32)
            .storeUint(0, 64) // op, queryId
            .storeAddress(from)
            .storeCoins(amount)
            .storeMaybeRef(null)
            .endCell();
    }

    async sendWithdrawJettons(provider: ContractProvider, via: Sender, from: Address, amount: bigint) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: JettonWallet.withdrawJettonsMessage(from, amount),
            value: toNano("0.1")
        });
    }
}
