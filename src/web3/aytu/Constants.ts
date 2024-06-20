import { Address } from "@ton/core";

export abstract class AntiBotOp {
  // ;; anti bot
  static pre_transfer_check = 961;
  static execute_transfer = 962;
  static update_white_list = 963;
  static set_white_list = 964;
}

export abstract class AytuRouterOp {
  static provide_lp = 4244235663;
  static swap = 630424929;
  static swap_jetton_for_ton = 3725043763;
  static swap_ton_for_jetton = 1262219366;
  static provide_lp_ton = 3269159862;
}

export const FTON_ADDRESS = Address.parse(
  "EQD__________________________________________0vo"
);
