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
import fs from "fs";

const tonClient = new TonClient({
  endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
  apiKey: "f1edbe23f2e52846732a2c92a0f171b8590cd4f762dfd8ba1b83712fca76bad1",
});

const router = tonClient.open(
  new DEX.v1.Router(
    Address.parse("EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt")
  )
);
function takeListSecretKey(): string[][] {
  const mnemonics: string = fs.readFileSync(
    path.join("./mnemonics.txt"),
    "utf-8"
  );
  const mnemonicList: string[] = mnemonics.split("\n");
  const secret_keys: string[][] = [];
  for (const mnemonic of mnemonicList) {
    secret_keys.push(mnemonic.split(" "));
  }
  return secret_keys;
}

const swapStonfi = async () => {
  const pTonAddress = "kQAcOvXSnnOhCdLYc6up2ECYwtNNTzlmOlidBeCs5cFPV7AM";
  const keys = takeListSecretKey();

  const mnemonics = Array.from(keys[0]); // replace with your mnemonic

  const keyPair = await mnemonicToPrivateKey(mnemonics);

  const workchain = 0;
  const wallet = WalletContractV4.create({
    workchain,
    publicKey: keyPair.publicKey,
  });

  // swap 1 TON to STON but not less than 1 nano STON
  const txParams = await router.getSwapTonToJettonTxParams({
    userWalletAddress: wallet.address, // ! replace with your address
    proxyTon: new pTON.v1(pTonAddress),
    offerAmount: toNano("0.1"),
    askJettonAddress: "EQC7gHjlX4bAXgsy4eExkVXb5HG1CyKlSIGkosxUJ2ReiBUU", // STON
    minAskAmount: "1",
    queryId: 12345,
  });

  const contract = tonClient.open(wallet);
  console.log(wallet.address);

  await contract.sendTransfer({
    seqno: await contract.getSeqno(),
    secretKey: keyPair.secretKey,
    messages: [internal(txParams)],
  });
};

swapStonfi().then();
