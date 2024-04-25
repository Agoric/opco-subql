import fetch from 'cross-fetch';
import {
  Message,
  TransferEvent,
  StateChangeEvent,
  OraclePrice,
  OraclePriceDaily,
  PsmMetric,
  PsmGovernance,
  Wallet,
  Vault,
  VaultManagerMetrics,
  VaultManagerGovernance,
  ReserveMetrics,
  ReserveAllocationMetrics,
  BoardAux,
  VaultManagerMetricsDaily,
  PsmMetricDaily,
  ReserveAllocationMetricsDaily,
  ReserveBalance,
} from "../types";
import { CosmosEvent, CosmosBlock } from "@subql/types-cosmos";
import {
  b64encode,
  b64decode,
  extractStoragePath,
  getStateChangeModule,
  extractBrand,
  resolveBrandNamesAndValues,
  dateToDayKey,
} from "./utils";

import { EVENT_TYPES, STORE_KEY, VSTORAGE_VALUE, KEY_KEY, VALUE_KEY } from "./constants";
import { psmEventKit } from "./events/psm";
import { boardAuxEventKit } from "./events/boardAux";
import { priceFeedEventKit } from "./events/priceFeed";
import { vaultsEventKit } from "./events/vaults";
import { reservesEventKit } from "./events/reserves";

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const API_ENDPOINT = 'https://main-a.api.agoric.net:443'

export async function handleBlock(block: CosmosBlock): Promise<void> {
  const moduleAccountsResponse = await fetch(`${API_ENDPOINT}/cosmos/auth/v1beta1/module_accounts`);
  const moduleAccounts = await moduleAccountsResponse.json();

  const reserveAccount = moduleAccounts.accounts.find((account: any) => account.name === 'vbank/reserve');
  const reserveAccountAddress = reserveAccount.base_account.address;

  const reserveAccountBalancesResponse = await fetch(`${API_ENDPOINT}/cosmos/bank/v1beta1/balances/${reserveAccountAddress}`);

  const reserveAccountBalances = await reserveAccountBalancesResponse.json();
  const istBalance = reserveAccountBalances.balances.find((balance: any) => balance.denom === "uist")

  const record = new ReserveBalance(block.block.id, BigInt(block.header.height), reserveAccountAddress, BigInt(istBalance.amount), 'uist');
  await record.save();
}

export async function handleStateChangeEvent(cosmosEvent: CosmosEvent): Promise<void> {
  const { event, block } = cosmosEvent;

  if (event.type != EVENT_TYPES.STATE_CHANGE) {
    logger.warn("Not valid state_change event.");
    return;
  }

  const storeAttr = event.attributes.find((a) => a.key === STORE_KEY);
  if (!storeAttr || storeAttr.value != VSTORAGE_VALUE) {
    return;
  }

  const valueAttr = event.attributes.find((a: any) => a.key === VALUE_KEY);
  if (!valueAttr || !valueAttr.value) {
    logger.warn("Value attribute is missing or empty.");
    return;
  }

  const keyAttr = event.attributes.find((a: any) => a.key === KEY_KEY);
  if (!keyAttr) {
    logger.warn("Key attribute is missing or empty.");
    return;
  }

  let data = Object();
  try {
    data = JSON.parse(b64decode(valueAttr.value));
  } catch (e) {
    return;
  }

  if (!data.values) {
    logger.warn("Data has not values.");
    return;
  }

  const path = extractStoragePath(b64decode(keyAttr.value));
  const module = getStateChangeModule(path);

  const recordSaves: (Promise<void> | undefined)[] = [];

  async function saveStateEvent(idx: number, value: any, payload: any) {
    const record = new StateChangeEvent(
      `${data.blockHeight}:${cosmosEvent.idx}:${idx}`,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      module,
      path,
      idx,
      JSON.stringify(value.slots),
      JSON.stringify(payload)
    );

    recordSaves.push(record.save());
  }

  const psmKit = psmEventKit(block, data, module, path);
  const boardKit = boardAuxEventKit(block, data, module, path);
  const priceKit = priceFeedEventKit(block, data, module, path);
  const vaultKit = vaultsEventKit(block, data, module, path);
  const reserveKit = reservesEventKit(block, data, module, path);

  const regexFunctionMap = [
    { regex: /^published\.priceFeed\..+price_feed$/, function: priceKit.savePriceFeed },
    { regex: /^published\.psm\..+\.metrics$/, function: psmKit.savePsmMetrics },
    { regex: /^published\.psm\..+\.governance$/, function: psmKit.savePsmGovernance },
    {
      regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.metrics$/,
      function: vaultKit.saveVaultManagerMetrics,
    },
    {
      regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.governance$/,
      function: vaultKit.saveVaultManagerGovernance,
    },
    { regex: /^published\.reserve\.metrics$/, function: reserveKit.saveReserveMetrics },
    { regex: /^published\.wallet\..+\.current$/, function: vaultKit.saveWallets },
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.vaults\.vault[0-9]+$/, function: vaultKit.saveVaults },
    { regex: /^published\.boardAux\.board[0-9]+$/, function: boardKit.saveBoardAux },
  ];

  for (let idx = 0; idx < data.values.length; idx++) {
    const rawValue: string = data.values[idx];
    if (!rawValue) {
      continue;
    }

    const value = JSON.parse(rawValue);
    const payload = JSON.parse(value.body.replace(/^#/, ""));

    resolveBrandNamesAndValues(payload);
    try {
      for (const { regex, function: action } of regexFunctionMap) {
        if (path.match(regex)) {
          recordSaves.push(...(await action(payload)));
          break;
        }
      }
      saveStateEvent(idx, value, payload);
    } catch (e) {
      logger.error(`Error for path: ${path}`);
      logger.error(e);
      throw e;
    }
  }

  await Promise.allSettled(recordSaves);
}
