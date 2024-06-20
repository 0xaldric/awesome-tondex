import { Address, Cell, Contract, beginCell, contractAddress, ContractProvider, Sender, SendMode, Slice } from "@ton/core";

export type LpAccountConfig = {
    userAddress: Slice,
    poolAddress: Slice,
    amount0: bigint,
    amount1: bigint
};

export function LpAccountConfigToCell(config: LpAccountConfig): Cell {
    return beginCell().storeSlice(config.userAddress).storeSlice(config.poolAddress).storeCoins(config.amount0).storeCoins(config.amount1).endCell();
}

export class LpAccount implements Contract {

    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) { }

    static createFromAddress(address: Address) {
        return new LpAccount(address);
    }

    static createFromConfig(config: LpAccountConfig, code: Cell, workchain = 0) {
        const data = LpAccountConfigToCell(config);
        const init = { code, data };
        return new LpAccount(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    static resetGasMessage(query_id: number | bigint = 0): Cell {
        return beginCell().storeUint(query_id, 64).endCell();
    }

    async sendResetGas(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: LpAccount.resetGasMessage(),
        });
    }

    static addLiquidityMessage(new_amount0: bigint, new_amount1: bigint, min_lp_out: bigint, query_id: number | bigint = 0,): Cell {
        return beginCell().storeUint(query_id, 64).storeCoins(new_amount0).storeCoins(new_amount1).storeCoins(min_lp_out).endCell();
    }

    async sendAddLiquidity(provider: ContractProvider, via: Sender, value: bigint, new_amount0: bigint, new_amount1: bigint, min_lp_out: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: LpAccount.addLiquidityMessage(new_amount0, new_amount1, min_lp_out),
        });
    }

    static refundMeMessage(query_id: number | bigint = 0): Cell {
        return beginCell().storeUint(query_id, 64).endCell();
    }

    async sendRefundMe(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: LpAccount.refundMeMessage(),
        });
    }

    static addDirectLiquidityMessage(new_amount0: bigint, new_amount1: bigint, min_lp_out: bigint, query_id: number | bigint = 0,): Cell {
        return beginCell().storeUint(query_id, 64).storeCoins(new_amount0).storeCoins(new_amount1).storeCoins(min_lp_out).endCell();
    }

    async sendDirectAddLiquidity(provider: ContractProvider, via: Sender, value: bigint, new_amount0: bigint, new_amount1: bigint, min_lp_out: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: LpAccount.addDirectLiquidityMessage(new_amount0, new_amount1, min_lp_out),
        });
    }
}
