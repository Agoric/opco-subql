import { b64encode } from "./utils";

export const EVENT_TYPES = {
  ACTIVE_PROPOSAL: "active_proposal",
  BURN: "burn",
  COIN_RECEIVED: "coin_received",
  COIN_SPENT: "coin_spent",
  COINBASE: "coinbase",
  COMMISSION: "commission",
  MESSAGE: "message",
  MINT: "mint",
  PROPOSAL_DEPOSIT: "proposal_deposit",
  PROPOSAL_VOTE: "proposal_vote",
  PROPOSER_REWARD: "proposer_reward",
  REWARDS: "rewards",
  STATE_CHANGE: "state_change",
  STORAGE: "storage",
  SUBMIT_PROPOSAL: "submit_proposal",
  TRANSFER: "transfer",
  SEND_PACKET: "send_packet",
  RECEIVE_PACKET: "recv_packet",
};

export const VAULT_STATES = {
  LIQUIDATING: "liquidating",
  LIQUIDATED: "liquidated",
};

export const VALUE_KEY = b64encode("value");
export const STORE_KEY = b64encode("store");
export const VSTORAGE_VALUE = b64encode("vstorage");
export const KEY_KEY = b64encode("key");
export const STORE_NAME_KEY = b64encode("store_name");
export const SUBKEY_KEY = b64encode("store_subkey");
export const UNPROVED_VALUE_KEY = b64encode("unproved_value");
export const PACKET_DATA_KEY = "packet_data";
export const PACKET_SRC_CHANNEL_KEY = "packet_src_channel";
