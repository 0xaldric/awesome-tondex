import {
    Address,
    Slice,
    Cell,
    Contract,
    ContractProvider,
    SendMode,
    Sender,
    beginCell,
    contractAddress
} from "@ton/core";

export type LpWalletConfig = {
    balance: bigint;
    ownerAddress: Slice;
    jettonMasterAddress: Slice;
    jettonWalletCode: Cell;
};

export function LpWalletConfigToCell(config: LpWalletConfig): Cell {
    return beginCell()
        .storeCoins(config.balance)
        .storeSlice(config.ownerAddress)
        .storeSlice(config.jettonMasterAddress)
        .storeRef(config.jettonWalletCode)
        .endCell();
}

export class LpWallet implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new LpWallet(address);
    }

    static createFromConfig(config: LpWalletConfig, code: Cell, workchain = 0) {
        const data = LpWalletConfigToCell(config);
        const init = { code, data };
        return new LpWallet(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    async getJettonBalance(provider: ContractProvider) {
        const state = await provider.getState();
        if (state.state.type !== "active") {
            return 0n;
        }
        const res = await provider.get("get_wallet_data", []);
        return res.stack.readBigNumber();
    }

    static transferMessage(
        jetton_amount: bigint,
        to: Address,
        responseAddress: Address,
        customPayload: Cell | null,
        forward_ton_amount: bigint,
        forwardPayload: Cell | null
    ) {
        return beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeUint(0, 64) // op, queryId
            .storeCoins(jetton_amount)
            .storeAddress(to)
            .storeAddress(responseAddress)
            .storeMaybeRef(customPayload)
            .storeCoins(forward_ton_amount)
            .storeMaybeRef(forwardPayload)
            .endCell();
    }
    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jetton_amount: bigint,
        to: Address,
        responseAddress: Address,
        customPayload: Cell,
        forward_ton_amount: bigint,
        forwardPayload: Cell
    ) {
        await provider.internal(via, {
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: LpWallet.transferMessage(
                jetton_amount,
                to,
                responseAddress,
                customPayload,
                forward_ton_amount,
                forwardPayload
            ),
            value: value
        });
    }
}
