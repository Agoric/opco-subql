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
};

export const VALUE_KEY = b64encode("value");
export const STORE_KEY = b64encode("store");
export const VSTORAGE_VALUE = b64encode("vstorage");
export const KEY_KEY = b64encode("key");
