import {
  Asset,
  Factory,
  PoolType,
  ReadinessStatus,
  VaultNative,
} from "@dedust/sdk";
import { mnemonicToPrivateKey } from "@ton/crypto";
import { Address, toNano, TonClient, WalletContractV4 } from "@ton/ton";

// ...

const tonClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
  apiKey: "f1edbe23f2e52846732a2c92a0f171b8590cd4f762dfd8ba1b83712fca76bad1",
});

const TESTNET_FACTORY_ADDR = Address.parse(
  "kQDgIWPdlUw9ikenycWj34rINQt_KB5IjZnpZUjw35aMCwBR"
);
const factory = tonClient.open(Factory.createFromAddress(TESTNET_FACTORY_ADDR));

const SCALE_ADDRESS = Address.parse(
  "EQC7gHjlX4bAXgsy4eExkVXb5HG1CyKlSIGkosxUJ2ReiBUU"
);
const TON_VAULT_ADDRESS = Address.parse(
  "kQDLcce6SZW3lk39MubJ55w5v8Lt-EBs60EapzNyrKHQ0ERz"
);

const TON = Asset.native();
const SCALE = Asset.jetton(SCALE_ADDRESS);

const swap = async () => {
  // Check if pool exists:
  const pool = tonClient.open(
    await factory.getPool(PoolType.VOLATILE, [TON, SCALE])
  );
  // NOTE: We will use tonVault to send a message.
  const tonVault = tonClient.open(
    VaultNative.createFromAddress(TON_VAULT_ADDRESS)
  );

  if ((await pool.getReadinessStatus()) !== ReadinessStatus.READY) {
    throw new Error("Pool (TON, SCALE) does not exist.");
  }

  // Check if vault exits:
  if ((await tonVault.getReadinessStatus()) !== ReadinessStatus.READY) {
    throw new Error("Vault (TON) does not exist.");
  }
  const amountIn = toNano("0.01"); // 5 TON

  const keyPair = await mnemonicToPrivateKey("your mnemonic".split(" "));
  const workchain = 0;
  const wallet = WalletContractV4.create({
    publicKey: keyPair.publicKey,
    workchain,
  });

  const sender = wallet.sender(
    tonClient.provider(wallet.address),
    keyPair.secretKey
  );

  await tonVault.sendSwap(sender, {
    poolAddress: pool.address,
    amount: amountIn,
    gasAmount: toNano("0.25"),
  });
};

swap().then();
