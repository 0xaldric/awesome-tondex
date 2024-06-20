import { Address } from "@ton/core";

export abstract class Op {
  static transfer = 0xf8a7ea5;
  static transfer_notification = 0x7362d09c;
  static internal_transfer = 0x178d4519;
  static excesses = 0xd53276db;
  static burn = 0x595f07bc;
  static burn_notification = 0x7bdd97de;

  static provide_wallet_address = 0x2c76b973;
  static take_wallet_address = 0xd1735400;
  static mint = 21;
  static change_admin = 3;
  static change_content = 4;

  // ;; anti bot
  static pre_transfer_check = 961;
  static execute_transfer = 962;
  static update_white_list = 963;
  static set_white_list = 964;
}

export abstract class OpRouter {
  static provide_lp = 4244235663;
  static swap = 630424929;
  static swap_jetton_for_ton = 3725043763;
  static swap_ton_for_jetton = 1262219366;
  static provide_lp_ton = 3269159862;
}

export const FTON_ADDRESS = Address.parse(
  "EQD__________________________________________0vo"
);
