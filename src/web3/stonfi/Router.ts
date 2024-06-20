import {
    Address,
    Cell,
    Contract,
    beginCell,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    Builder,
    TupleItem
} from "@ton/core";

export type RouterConfig = {
    isLooked: boolean;
    adminAddress: Address;
    LpWalletCode: Cell;
    poolCode: Cell;
    LpAccountCode: Cell;
};
function beginMessage(params: { op: bigint }): Builder {
    return beginCell()
        .storeUint(params.op, 32)
        .storeUint(Math.floor(Math.random() * Math.pow(2, 31)), 64);
}

export function RouterConfigToCell(config: RouterConfig): Cell {
    return beginCell()
        .storeUint(config.isLooked ? 1 : 0, 1)
        .storeAddress(config.adminAddress)
        .storeRef(config.LpWalletCode)
        .storeRef(config.poolCode)
        .storeRef(config.LpAccountCode)
        .storeRef(
            beginCell().storeUint(0, 64).storeUint(0, 64).storeAddress(null).storeRef(beginCell().endCell()).endCell()
        )
        .endCell();
}

export class Router implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell }
    ) {}

    static createFromAddress(address: Address) {
        return new Router(address);
    }

    static createFromConfig(config: RouterConfig, code: Cell, workchain = 0) {
        const data = RouterConfigToCell(config);
        const init = { code, data };
        return new Router(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell()
        });
    }

    static payToMessage(
        owner: Address,
        tokenAAmount: bigint,
        walletTokenAAddress: Address,
        tokenBAmount: bigint,
        walletTokenBAmount: Address
    ): Cell {
        return beginCell()
            .storeAddress(owner)
            .storeCoins(tokenAAmount)
            .storeAddress(walletTokenAAddress)
            .storeCoins(tokenBAmount)
            .storeAddress(walletTokenBAmount)
            .endCell();
    }

    async sendPayTo(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        owner: Address,
        tokenAAmount: bigint,
        walletTokenAAddress: Address,
        tokenBAmount: bigint,
        walletTokenBAmount: Address
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Router.payToMessage(owner, tokenAAmount, walletTokenAAddress, tokenBAmount, walletTokenBAmount)
        });
    }

    static transferNotificationMessage(): Cell {
        return beginCell().endCell();
    }

    static setFeesMessage(
        jetton0Address: Address,
        jetton1Address: Address,
        newLPFee: bigint,
        newProtocolFee: bigint,
        newRefFee: bigint,
        newProtocolFeeAddress: Address
    ): Cell {
        return beginCell()
            .storeUint(newLPFee, 8)
            .storeUint(newProtocolFee, 8)
            .storeUint(newRefFee, 8)
            .storeAddress(newProtocolFeeAddress)
            .storeRef(beginCell().storeAddress(jetton0Address).storeAddress(jetton1Address).endCell())
            .endCell();
    }

    async sendSetFees(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jetton0Address: Address,
        jetton1Address: Address,
        newLPFee: bigint,
        newProtocolFee: bigint,
        newRefFee: bigint,
        newProtocolFeeAddress: Address
    ) {
        {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: Router.setFeesMessage(
                    jetton0Address,
                    jetton1Address,
                    newLPFee,
                    newProtocolFee,
                    newRefFee,
                    newProtocolFeeAddress
                )
            });
        }
    }

    static collectFeesMessage(jetton0Address: Address, jetton1Address: Address): Cell {
        return beginCell().storeAddress(jetton0Address).storeAddress(jetton1Address).endCell();
    }

    async sendCollectFees(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jetton0Address: Address,
        jetton1Address: Address
    ) {
        {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: Router.collectFeesMessage(jetton0Address, jetton1Address)
            });
        }
    }

    static lockMessage(): Cell {
        return beginCell().endCell();
    }

    static unLockMessage(): Cell {
        return beginCell().endCell();
    }

    static initCodeUpgradeMessage(newCode: Cell): Cell {
        return beginCell().storeRef(newCode).endCell();
    }

    async sendInitCodeUpgrade(provider: ContractProvider, via: Sender, value: bigint, newCode: Cell) {
        {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: Router.initCodeUpgradeMessage(newCode)
            });
        }
    }

    static initAdminUpgradeMessage(newAdmin: Address): Cell {
        return beginCell().storeAddress(newAdmin).endCell();
    }

    async sendInitAdminUpgrade(provider: ContractProvider, via: Sender, value: bigint, newAdmin: Address) {
        {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: Router.initAdminUpgradeMessage(newAdmin)
            });
        }
    }

    static cancelAdminUpgradeMessage(): Cell {
        return beginCell().endCell();
    }

    async sendCancelAdminUpgrade(provider: ContractProvider, via: Sender, value: bigint) {
        {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: Router.cancelAdminUpgradeMessage()
            });
        }
    }

    static cancelCodeUpgradeMessage(): Cell {
        return beginCell().endCell();
    }

    async sendCancelCodeUpgrade(provider: ContractProvider, via: Sender, value: bigint) {
        {
            await provider.internal(via, {
                value,
                sendMode: SendMode.PAY_GAS_SEPARATELY,
                body: Router.cancelCodeUpgradeMessage()
            });
        }
    }

    static finalizeUpgradesMessage(): Cell {
        return beginCell().endCell();
    }

    static resetGasMessage(): Cell {
        return beginCell().endCell();
    }

    static resetPoolGasMessage(): Cell {
        return beginCell().endCell();
    }

    static swapMessage(
        jettonAmount: bigint,
        fromAddress: Address,
        walletTokenBAddress: Address,
        toAddress: Address,
        expectedOutput: bigint,
        refAddress?: Address
    ): Cell {
        return beginCell()
            .storeCoins(jettonAmount)
            .storeAddress(fromAddress)
            .storeBit(true)
            .storeRef(
                beginCell()
                    .storeAddress(walletTokenBAddress)
                    .storeCoins(expectedOutput)
                    .storeAddress(toAddress)
                    .storeBit(!!refAddress)
                    .endCell()
            )
            .endCell();
    }

    static swapMessageV2(params: {
        jettonAmount: bigint;
        fromAddress: Address;
        walletTokenBAddress: Address;
        toAddress: Address;
        expectedOutput: bigint;
        refAddress?: Address;
    }): Cell {
        const swapPayload = beginCell()
            .storeUint(0xf8a7ea5, 32)
            .storeAddress(params.walletTokenBAddress)
            .storeCoins(params.expectedOutput)
            .storeAddress(params.toAddress)
            .storeBit(!!params.refAddress);

        if (!params.refAddress) swapPayload.storeAddress(params.refAddress || null);

        return beginMessage({ op: 0x7362d09cn })
            .storeCoins(params.jettonAmount)
            .storeAddress(params.fromAddress)
            .storeBit(true)
            .storeRef(swapPayload.endCell())
            .endCell();
    }

    async sendSwap(
        provider: ContractProvider,
        via: Sender,
        value: bigint,
        jettonAmount: bigint,
        fromAddress: Address,
        walletTokenBAddress: Address,
        toAddress: Address,
        expectedOutput: bigint,
        refAddress?: Address
    ) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: Router.swapMessageV2({ jettonAmount, fromAddress, walletTokenBAddress, toAddress, expectedOutput })
        });
    }

    async getPoolAddress(provider: ContractProvider, token0: Address, token1: Address) {
        const token0Param: TupleItem = {
            type: "slice",
            cell: beginCell().storeAddress(token0).endCell()
        };

        const token1Param: TupleItem = {
            type: "slice",
            cell: beginCell().storeAddress(token1).endCell()
        };

        const { stack } = await provider.get("get_pool_address", [token0Param, token1Param]);

        return stack.readAddress();
    }
}
