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
} from "../types";
import { CosmosEvent } from "@subql/types-cosmos";
import {
  b64encode,
  b64decode,
  extractStoragePath,
  getStateChangeModule,
  extractBrand,
  resolveBrandNamesAndValues,
  dateToDayKey,
} from "./utils";

import {
  EVENT_TYPES,
  STORE_KEY,
  VSTORAGE_VALUE,
  KEY_KEY,
  VALUE_KEY,
  STORE_NAME_KEY,
  SUBKEY_KEY,
  UNPROVED_VALUE_KEY,
} from "./constants";
import { psmEventKit } from "./events/psm";
import { boardAuxEventKit } from "./events/boardAux";
import { priceFeedEventKit } from "./events/priceFeed";
import { vaultsEventKit } from "./events/vaults";
import { reservesEventKit } from "./events/reserves";

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export async function handleStateChangeEvent(cosmosEvent: CosmosEvent): Promise<void> {
  const { event, block } = cosmosEvent;

  if (event.type != EVENT_TYPES.STATE_CHANGE) {
    logger.warn("Not valid state_change event.");
    return;
  }

  const storeAttr = event.attributes.find((a) => a.key === STORE_KEY || a.key === STORE_NAME_KEY);
  if (!storeAttr || storeAttr.value != VSTORAGE_VALUE) {
    return;
  }

  const valueAttr = event.attributes.find((a: any) => a.key === VALUE_KEY || a.key === UNPROVED_VALUE_KEY);
  if (!valueAttr || !valueAttr.value) {
    logger.warn("Value attribute is missing or empty.");
    return;
  }

  const keyAttr = event.attributes.find((a: any) => a.key === KEY_KEY || a.key === SUBKEY_KEY);
  if (!keyAttr) {
    logger.warn("Key attribute is missing or empty.");
    return;
  }

  let data = Object();
  try {
    const decodedValue =
      valueAttr.key === UNPROVED_VALUE_KEY ? b64decode(b64decode(valueAttr.value)) : b64decode(valueAttr.value);
    data = JSON.parse(decodedValue);
  } catch (e) {
    return;
  }

  if (!data.values) {
    logger.warn("Data has not values.");
    return;
  }

  const decodedKey =
    keyAttr.key === SUBKEY_KEY
      ? b64decode(b64decode(keyAttr.value)).replaceAll("\u0000", "\x00")
      : b64decode(keyAttr.value);
  const path = extractStoragePath(decodedKey);
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
      JSON.stringify(payload),
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
