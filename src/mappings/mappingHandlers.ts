import {  Message, TransferEvent, StateChangeEvent, OraclePrice, PsmMetric, PsmGovernance, Wallet, Vault, VaultManagerMetrics, VaultManagerGovernance, ReserveMetrics, ReserveAllocationMetrics, BoardAux } from "../types";
import {
  CosmosEvent,
} from "@subql/types-cosmos";
import { b64encode, b64decode, extractStoragePath, getStateChangeModule, extractBrand, resolveBrandNamesAndValues } from "./utils";

const VALUE_KEY = b64encode('value');
const STORE_KEY = b64encode('store');
const VSTORAGE_VALUE = b64encode('vstorage');
const KEY_KEY = b64encode('key');

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Write a test for the following function in src/test/mappingHandlers.test.ts

export async function handleStateChangeEvent(cosmosEvent: CosmosEvent): Promise<void> {
  const { event, block } = cosmosEvent;

  if (event.type != 'state_change') {
    logger.warn('Not valid state_change event.');
    return;
  }

  const storeAttr = event.attributes.find(a => a.key === STORE_KEY);
  if (!storeAttr || storeAttr.value != VSTORAGE_VALUE) {
    return;
  }

  const valueAttr = event.attributes.find((a: any) => a.key === VALUE_KEY);
  if (!valueAttr || !valueAttr.value) {
    logger.warn('Value attribute is missing or empty.');
    return;
  }

  const keyAttr = event.attributes.find((a: any) => a.key === KEY_KEY);
  if (!keyAttr) {
    logger.warn('Key attribute is missing or empty.');
    return;
  }

  let data = Object();
  try {
    data = JSON.parse(b64decode(valueAttr.value));
  } catch (e) {
    return;
  }

  if (!data.values) {
    logger.warn('Data has not values.');
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

  async function savePsmMetrics(payload: any) {
    const psmMetric = new PsmMetric(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      path.split('.')[3],
      path.split('.')[3],
      BigInt(payload.anchorPoolBalance.__value),
      BigInt(payload.feePoolBalance.__value),
      BigInt(payload.mintedPoolBalance.__value),
      BigInt(payload.totalAnchorProvided.__value),
      BigInt(payload.totalMintedProvided.__value)
    );
    // logger.info("savePsmMetrics: " + JSON.stringify(psmMetric));
    recordSaves.push(psmMetric.save());
  }

  async function savePsmGovernance(payload: any) {
    const psmGovernance = new PsmGovernance(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      path.split('.')[3],
      path.split('.')[3],
      BigInt(payload.mintLimit.__value),
      BigInt(payload.giveMintedFee.value.denominator.__value),
      BigInt(payload.giveMintedFee.value.numerator.__value),
      BigInt(payload.wantedMintedFee.value.denominator.__value),
      BigInt(payload.wantedMintedFee.value.numerator.__value)
    );
    // logger.info("savePsmGovernance: " + JSON.stringify(psmGovernance));
    recordSaves.push(psmGovernance.save());
  }

  async function saveVaultManagerGovernance(payload: any) {
    const vaultManagerGovernance = new VaultManagerGovernance(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      BigInt(payload.current.DebtLimit.value.__value),
      BigInt(payload.current.InterestRate.value?.denominator.__value ?? 0),
      BigInt(payload.current.InterestRate.value?.numerator.__value ?? 0),
      BigInt(payload.current.LiquidationMargin.value?.denominator.__value ?? 0),
      BigInt(payload.current.LiquidationMargin.value?.numerator.__value ?? 0),
      BigInt(payload.current.LiquidationPadding.value?.denominator.__value ?? 0),
      BigInt(payload.current.LiquidationPadding.value?.numerator.__value ?? 0),
      BigInt(payload.current.LiquidationPenalty.value?.denominator.__value ?? 0),
      BigInt(payload.current.LiquidationPenalty.value?.numerator.__value ?? 0),
      BigInt(payload.current.MintFee.value?.denominator.__value ?? 0),
      BigInt(payload.current.MintFee.value?.numerator.__value ?? 0)
    );
    // logger.info("vaultManagerGovernance: " + JSON.stringify(vaultManagerGovernance));
    recordSaves.push(vaultManagerGovernance.save());
  }

  async function saveReserveMetrics(payload: any) {
    const reserveMetric = new ReserveMetrics(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      BigInt(payload.shortfallBalance.__value),
      BigInt(payload.totalFeeBurned.__value),
      BigInt(payload.totalFeeMinted.__value)
    );
    // logger.info("reserveMetric: " + JSON.stringify(reserveMetric));
    recordSaves.push(reserveMetric.save());

    for (const key in payload.allocations) {
      if (payload.allocations.hasOwnProperty(key)) {
        const allocation = payload.allocations[key];
        const reserveAllocationMetric = new ReserveAllocationMetrics(
          `${path}:${key}`,
          BigInt(data.blockHeight),
          block.block.header.time as any,
          extractBrand(allocation.__brand),
          key,
          BigInt(allocation.__value),
          reserveMetric.id
        );
        // logger.info("reserveAllocationMetric: " + JSON.stringify(reserveAllocationMetric));
        recordSaves.push(reserveAllocationMetric.save());
      }
    }
  }

  async function saveWallets(payload: any) {
    const address = path.split('.')[2];
    const wallet = new Wallet(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      address
    );

    if (payload.offerToPublicSubscriberPaths) {
      for (let i = 0; i < payload.offerToPublicSubscriberPaths.length; i++) {
        const [_, { vault: vaultId }] = payload.offerToPublicSubscriberPaths[i] as [string, { vault: string; }];

        let vault = await Vault.get(vaultId);
        if (!vault) {
          vault = new Vault(
            vaultId,
            BigInt(data.blockHeight),
            block.block.header.time as any,
            wallet.id);
        }
        vault.walletId = wallet.id;
        recordSaves.push(vault.save());
      }
    }

    recordSaves.push(wallet.save());
  }

  async function saveVaults(payload: any) {
    let vault = await Vault.get(path);
    if (!vault) {
      vault = new Vault(
        path,
        BigInt(data.blockHeight),
        block.block.header.time as any,
        '',
      );
    }

    vault.coin = payload?.locked?.__brand;
    vault.token = payload?.locked?.__brand;
    vault.debt = payload?.debtSnapshot?.debt?.__value;
    vault.balance = payload?.locked?.__value;
    vault.state = payload?.vaultState;
    recordSaves.push(vault.save());
  }

  async function saveBoardAux(payload: any) {
    const boardAux = new BoardAux(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      payload.allegedName,
      payload.displayInfo.assetKind,
      payload.displayInfo.decimalPlaces ?? 0
    );
    // logger.info("boardAux: " + JSON.stringify(boardAux));
    recordSaves.push(boardAux.save());
  }

  async function savePriceFeed(payload: any) {
    const matchTypeInName = path.match(/priceFeed\.(.+?)-/);
    const typeInName = matchTypeInName ? matchTypeInName[1] : undefined;
    const matchTypeOutName = path.match(/-(.+?)_price_feed/);
    const typeOutName = matchTypeOutName ? matchTypeOutName[1] : undefined;

    if (typeInName !== undefined && typeOutName !== undefined) {
      const oraclePrice = new OraclePrice(
        path,
        BigInt(data.blockHeight),
        block.block.header.time as any,
        path.split('published.priceFeed.')[1],
        BigInt(payload.amountIn.__value),
        BigInt(payload.amountOut.__value),
        typeInName,
        typeOutName
      );
      // logger.info("oraclePrice: " + JSON.stringify(oraclePrice));
      recordSaves.push(oraclePrice.save());
    }
  }

  async function saveVaultManagerMetrics(payload: any) {
    const vaultManagerMetric = new VaultManagerMetrics(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      extractBrand(payload.liquidatingCollateral.__brand),
      BigInt(payload.liquidatingCollateral.__value),
      extractBrand(payload.liquidatingDebt.__brand),
      BigInt(payload.liquidatingDebt.__value),
      BigInt(payload.lockedQuote?.denominator.__value ?? 0),
      BigInt(payload.lockedQuote?.numerator.__value ?? 0),
      BigInt(payload.numActiveVaults),
      BigInt(payload.numLiquidatingVaults),
      BigInt(payload.numLiquidationsAborted),
      BigInt(payload.numLiquidationsCompleted),
      BigInt(payload.retainedCollateral.__value),
      BigInt(payload.totalCollateral.__value),
      BigInt(payload.totalCollateralSold.__value),
      BigInt(payload.totalDebt.__value),
      BigInt(payload.totalOverageReceived.__value),
      BigInt(payload.totalProceedsReceived.__value),
      BigInt(payload.totalShortfallReceived.__value)
    );
    // logger.info("vaultManagerMetric: " + JSON.stringify(vaultManagerMetric));
    recordSaves.push(vaultManagerMetric.save());
  }

  const regexFunctionMap = [
    { regex: /^published\.priceFeed\..+price_feed$/, function: savePriceFeed },
    { regex: /^published\.psm\..+\.metrics$/, function: savePsmMetrics },
    { regex: /^published\.psm\..+\.governance$/, function: savePsmGovernance },
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.metrics$/, function: saveVaultManagerMetrics },
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.governance$/, function: saveVaultManagerGovernance },
    { regex: /^published\.reserve\.metrics$/, function: saveReserveMetrics },
    { regex: /^published\.wallet\..+\.current$/, function: saveWallets},
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.vaults\.vault[0-9]+$/, function: saveVaults },
    { regex: /^published\.boardAux\.board[0-9]+$/, function: saveBoardAux }
  ];
  
  for (let idx = 0; idx < data.values.length; idx++) {
    const rawValue: string = data.values[idx];
    if (!rawValue) {
      return undefined;
    }

    const value = JSON.parse(rawValue);
    const payload = JSON.parse(value.body.replace(/^#/, ''));

    resolveBrandNamesAndValues(payload);

    for (const { regex, function: action } of regexFunctionMap) {
      if (path.match(regex)) {
        await action(payload);
        break;
      }
    }
    saveStateEvent(idx, value, payload);
  }

  await Promise.all(recordSaves);
}