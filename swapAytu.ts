import {
  Address,
  TonClient,
  TonClient4,
  WalletContractV4,
  internal,
  toNano,
} from "@ton/ton";
import { DEX, pTON } from "@ston-fi/sdk";
import { mnemonicToPrivateKey } from "@ton/crypto";
import path from "path";
import { Router } from "./RouterAytu";

const tonClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
  apiKey: "f1edbe23f2e52846732a2c92a0f171b8590cd4f762dfd8ba1b83712fca76bad1",
});

const router = tonClient.open(
  new DEX.v1.Router(
    Address.parse("EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt")
  )
);

const swapAytu = async () => {
  const mnemonics = Array.from(""); // replace with your mnemonic

  const keyPair = await mnemonicToPrivateKey(mnemonics);

  const workchain = 0;
  const wallet = WalletContractV4.create({
    workchain,
    publicKey: keyPair.publicKey,
  });
  const sender = wallet.sender(
    tonClient.provider(wallet.address),
    keyPair.secretKey
  );

  const SCALE_ADDRESS = Address.parse(
    "EQC7gHjlX4bAXgsy4eExkVXb5HG1CyKlSIGkosxUJ2ReiBUU"
  );
  const masterPoolWallet = Address.parse(
    "kQCexKO3foMDHTkbAG3futAbrb3XyeOYBNJmFUt2LGtfiQKp"
  );

  const masterPool = tonClient.open(
    Router.createFromAddress(
      Address.parse("kQCwpMCz1hOOocUCe0zmFoeup1yGICafkl1LipYRZBVo801p")
    )
  );
  await masterPool.sendSwapTonForJetton(
    sender,
    toNano("0.3"),
    toNano("0.1"),
    masterPoolWallet,
    1n,
    wallet.address,
    0,
    null,
    undefined
  );
  console.log("DONE");
};

swapAytu().then();
