import {
    Address,
    Slice,
    Cell,
    Contract,
    beginCell,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode
} from "@ton/core";

export type PoolConfig = {
    routerAddress: Address;
    lpFee: bigint;
    protocolFee: bigint;
    refFee: bigint;
    token0Address: Address;
    token1Address: Address;
    totalSupplyLp: bigint;
    collectedToken0ProtocolFee: bigint;
    collectedToken1ProtocolFee: bigint;
    protocolFeeAddress: Address;
    reserve0: bigint;
    reserve1: bigint;
    jettonLpWalletCode: Cell;
    lpAccountCode: Cell;
};

export type RawStonFiPoolData = {
    reserve0: bigint;
    reserve1: bigint;
    token0_address: Address;
    token1_address: Address;
    lp_fee: bigint;
    protocol_fee: bigint;
    ref_fee: bigint;
    protocol_fee_address: Address;
    collected_token0_protocol_fee: bigint;
    collected_token1_protocol_fee: bigint;
};

export function PoolConfigToCell(config: PoolConfig): Cell {
    return beginCell()
        .storeAddress(config.routerAddress)
        .storeUint(config.lpFee, 8)
        .storeUint(config.protocolFee, 8)
        .storeUint(config.refFee, 8)
        .storeAddress(config.token0Address)
        .storeAddress(config.token1Address)
        .storeCoins(config.totalSupplyLp)
        .storeRef(
            beginCell()
                .storeCoins(config.collectedToken0ProtocolFee)
                .storeCoins(config.collectedToken1ProtocolFee)
                .storeAddress(config.protocolFeeAddress)
                .storeCoins(config.reserve0)
                .storeCoins(config.reserve1)
                .endCell()
        )
        .storeRef(config.jettonLpWalletCode)
        .storeRef(config.lpAccountCode)
        .endCell();
}

export class Pool implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new Pool(address);
    }

    static createFromConfig(config: PoolConfig, code: Cell, workchain = 0) {
        const data = PoolConfigToCell(config);
        const init = { code, data };
        return new Pool(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    static burnNotificationMessage(
        jettonAmount: bigint,
        fromAddress: Address,
        responseAddress: Address,
        query_id: number | bigint = 0
    ): Cell {
        return beginCell()
            .storeUint(query_id, 64)
            .storeCoins(jettonAmount)
            .storeAddress(fromAddress)
            .storeAddress(responseAddress)
            .endCell();
    }

    async sendBurnNotification(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jettonAmount: bigint,
        fromAddress: Address,
        responseAddress: Address
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Pool.burnNotificationMessage(jettonAmount, fromAddress, responseAddress)
        });
    }

    static swapMessage(
        fromAddress: Address,
        tokenWallet: Address,
        jettonAmount: bigint,
        minOutput: bigint,
        hasRef?: boolean,
        refAddress?: Address
    ): Cell {
        return beginCell()
            .storeAddress(fromAddress)
            .storeAddress(tokenWallet)
            .storeCoins(jettonAmount)
            .storeCoins(minOutput)
            .storeBit(!!hasRef)
            .storeBit(true)
            .storeRef(
                beginCell()
                    .storeAddress(fromAddress)
                    .storeAddress(refAddress || null)
                    .endCell()
            )
            .endCell();
    }

    async sendSwap(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        fromAddress: Address,
        tokenWallet: Address,
        jettonAmount: bigint,
        minOutput: bigint,
        hasRef?: boolean,
        refAddress?: Address
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Pool.swapMessage(fromAddress, tokenWallet, jettonAmount, minOutput, hasRef, refAddress)
        });
    }

    static provideLiquidityMessage(
        fromAddress: Slice,
        jettonAmount0: bigint,
        jettonAmount1: bigint,
        minLpOut: bigint,
        query_id: number | bigint = 0
    ): Cell {
        return beginCell()
            .storeUint(query_id, 64)
            .storeSlice(fromAddress)
            .storeCoins(jettonAmount0)
            .storeCoins(jettonAmount1)
            .storeCoins(minLpOut)
            .endCell();
    }

    async sendProvideLiquidity(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        fromAddress: Slice,
        jettonAmount0: bigint,
        jettonAmount1: bigint,
        minLpOut: bigint
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Pool.provideLiquidityMessage(fromAddress, jettonAmount0, jettonAmount1, minLpOut)
        });
    }

    async getPoolData(provider: ContractProvider): Promise<RawStonFiPoolData> {
        const result = await provider.get("get_pool_data", []);
        const reserve0 = result.stack.readBigNumber();
        const reserve1 = result.stack.readBigNumber();
        const token0_address = result.stack.readAddress();
        const token1_address = result.stack.readAddress();
        const lp_fee = result.stack.readBigNumber();
        const protocol_fee = result.stack.readBigNumber();
        const ref_fee = result.stack.readBigNumber();
        const protocol_fee_address = result.stack.readAddress();
        const collected_token0_protocol_fee = result.stack.readBigNumber();
        const collected_token1_protocol_fee = result.stack.readBigNumber();

        return {
            reserve0,
            reserve1,
            token0_address,
            token1_address,
            lp_fee,
            protocol_fee,
            ref_fee,
            protocol_fee_address,
            collected_token0_protocol_fee,
            collected_token1_protocol_fee
        };
    }
}
