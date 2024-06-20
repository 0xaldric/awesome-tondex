import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Sender,
  SendMode,
} from "@ton/core";

import { AytuRouterOp } from "./Constants";

type TempUpgrade = {
  endCode: number;
  endAdmin: number;
  admin: Address;
  code: Cell;
};

type RouterConfig = {
  gasConsumption: number | bigint;
  adminAddress: Address;
  jettonLpWalletCode: Cell;
  lpAccountCode: Cell;
  tempUpgrade: TempUpgrade;
};

const tempUpgradeToCell = (tempUpgrade: TempUpgrade) => {
  return beginCell()
    .storeUint(tempUpgrade.endCode, 64)
    .storeUint(tempUpgrade.endAdmin, 64)
    .storeAddress(tempUpgrade.admin)
    .storeRef(tempUpgrade.code)
    .endCell();
};

const routerConfigToCell = (config: RouterConfig): Cell => {
  return beginCell()
    .storeUint(0, 1)
    .storeUint(config.gasConsumption, 32)
    .storeAddress(config.adminAddress)
    .storeRef(config.jettonLpWalletCode)
    .storeRef(config.lpAccountCode)
    .storeMaybeRef(null)
    .storeRef(tempUpgradeToCell(config.tempUpgrade))
    .endCell();
};

export class Router implements Contract {
  constructor(
    readonly address: Address,
    readonly init?: { code: Cell; data: Cell }
  ) { }

  static createFromAddress(address: Address) {
    return new Router(address);
  }

  static createFromConfig(
    config: RouterConfig,
    code: Cell,
    workchain = 0
  ): Router {
    const data = routerConfigToCell(config);
    const init = { code, data };
    return new Router(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().endCell(),
    });
  }

  sendSwapTonForJettonMessage = (
    tonAmount: bigint,
    tokenWallet1: Address,
    minOut: bigint,
    receiver: Address,
    hasRef: number,
    refAddress: Address | null,
    queryId: number
  ) => {
    let body = beginCell()
      .storeUint(AytuRouterOp.swap_ton_for_jetton, 32)
      .storeUint(queryId, 64)
      .storeCoins(tonAmount)
      .storeAddress(tokenWallet1)
      .storeCoins(minOut)
      .storeAddress(receiver)
      .storeUint(hasRef, 1);
    if (hasRef) {
      body = body.storeAddress(refAddress);
    }
    return body.endCell();
  };

  async sendSwapTonForJetton(
    provider: ContractProvider,
    via: Sender,
    value: bigint,
    tonAmount: bigint,
    tokenWallet1: Address,
    minOut: bigint,
    receiver: Address,
    hasRef: number,
    refAddress: Address | null,
    queryId: number = 0
  ) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: this.sendSwapTonForJettonMessage(
        tonAmount,
        tokenWallet1,
        minOut,
        receiver,
        hasRef,
        refAddress,
        queryId
      ),
    });
  }

  async getLPWalletAddress(
    provider: ContractProvider,
    owner: Address,
    token0: Address,
    token1: Address
  ): Promise<Address> {
    const res = await provider.get("get_lp_wallet_address", [
      { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token0).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token1).endCell() },
    ]);
    return res.stack.readAddress();
  }

  async getLPAccountAddress(
    provider: ContractProvider,
    owner: Address,
    token0: Address,
    token1: Address
  ): Promise<Address> {
    const res = await provider.get("get_lp_account_address", [
      { type: "slice", cell: beginCell().storeAddress(owner).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token0).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token1).endCell() },
    ]);
    return res.stack.readAddress();
  }

  async getExpectedAmountOut(
    provider: ContractProvider,
    amount: bigint,
    token0: Address,
    token1: Address
  ) {
    const res = await provider.get("get_expected_outputs", [
      { type: "int", value: amount },
      { type: "slice", cell: beginCell().storeAddress(token0).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token1).endCell() },
    ]);

    const out = res.stack.readBigNumber();
    const protocolFeeOut = res.stack.readBigNumber();
    const refFeeOut = res.stack.readBigNumber();
    return { out, protocolFeeOut, refFeeOut };
  }

  async getExpectedAmountIn(
    provider: ContractProvider,
    amount: bigint,
    token0: Address,
    token1: Address
  ) {
    const res = await provider.get("get_expected_input", [
      { type: "int", value: amount },
      { type: "slice", cell: beginCell().storeAddress(token0).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token1).endCell() },
    ]);

    const amountIn = res.stack.readBigNumber();
    return { amountIn };
  }

  async getPoolData(
    provider: ContractProvider,
    token0: Address,
    token1: Address
  ) {
    const res = await provider.get("get_pool_data", [
      { type: "slice", cell: beginCell().storeAddress(token0).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token1).endCell() },
    ]);

    const reserve0 = res.stack.readBigNumber();
    const reserve1 = res.stack.readBigNumber();
    const token0Address = res.stack.readAddress();
    const token1Address = res.stack.readAddress();
    const lpFee = res.stack.readBigNumber();
    const protocolFee = res.stack.readBigNumber();
    const refFee = res.stack.readBigNumber();
    const collectedToken0ProtocolFee = res.stack.readBigNumber();
    const collectedToken1ProtocolFee = res.stack.readBigNumber();
    const poolKey = res.stack.readBigNumber();
    return {
      reserve0,
      reserve1,
      token0Address,
      token1Address,
      lpFee,
      protocolFee,
      refFee,
      collectedToken0ProtocolFee,
      collectedToken1ProtocolFee,
      poolKey,
    };
  }

  async getExpectedLiquidity(
    provider: ContractProvider,
    token0: Address,
    amount0: bigint,
    token1: Address,
    amount1: bigint
  ) {
    const res = await provider.get("get_expected_liquidity", [
      { type: "slice", cell: beginCell().storeAddress(token0).endCell() },
      { type: "int", value: amount0 },
      { type: "slice", cell: beginCell().storeAddress(token1).endCell() },
      { type: "int", value: amount1 },
    ]);

    const liquidity = res.stack.readBigNumber();
    return { liquidity };
  }

  async getExpectedTokens(
    provider: ContractProvider,
    token0: Address,
    token1: Address,
    liquidity: bigint
  ) {
    const res = await provider.get("get_expected_tokens", [
      { type: "slice", cell: beginCell().storeAddress(token0).endCell() },
      { type: "slice", cell: beginCell().storeAddress(token1).endCell() },
      { type: "int", value: liquidity },
    ]);

    const amount0 = res.stack.readBigNumber();
    const amount1 = res.stack.readBigNumber();
    return { amount0, amount1 };
  }
}
