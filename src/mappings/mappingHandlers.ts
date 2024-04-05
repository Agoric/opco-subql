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

const VALUE_KEY = b64encode('value');
const STORE_KEY = b64encode('store');
const VSTORAGE_VALUE = b64encode('vstorage');
const KEY_KEY = b64encode('key');

// @ts-ignore
BigInt.prototype.toJSON = function () {
  return this.toString();
};

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
    savePsmMetricDaily(payload);
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
    recordSaves.push(psmMetric.save());
  }

  async function savePsmMetricDaily(payload: any) {
    const dateKey = dateToDayKey(block.block.header.time);
  
    let state = await getPsmMetricDaily(path, dateKey);
  
    state.token = path.split('.')[3];
  
    state.anchorPoolBalanceLast = BigInt(payload.anchorPoolBalance.__value);
    state.feePoolBalanceLast = BigInt(payload.feePoolBalance.__value);
    state.mintedPoolBalanceLast = BigInt(payload.mintedPoolBalance.__value);
    state.totalAnchorProvidedLast = BigInt(payload.totalAnchorProvided.__value);
    state.totalMintedProvidedLast = BigInt(payload.totalMintedProvided.__value);
  
    state.anchorPoolBalanceSum = (state.anchorPoolBalanceSum ?? BigInt(0)) + BigInt(payload.anchorPoolBalance.__value);
    state.feePoolBalanceSum = (state.feePoolBalanceSum ?? BigInt(0)) + BigInt(payload.feePoolBalance.__value);
    state.mintedPoolBalanceSum = (state.mintedPoolBalanceSum ?? BigInt(0)) + BigInt(payload.mintedPoolBalance.__value);
    state.totalAnchorProvidedSum = (state.totalAnchorProvidedSum ?? BigInt(0)) + BigInt(payload.totalAnchorProvided.__value);
    state.totalMintedProvidedSum = (state.totalMintedProvidedSum ?? BigInt(0)) + BigInt(payload.totalMintedProvided.__value);
    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);

    recordSaves.push(state.save());
  }
  
  async function getPsmMetricDaily(path: string, dateKey: number): Promise<PsmMetricDaily> {
    const id = path + ':' + dateKey.toString();
    let state = await PsmMetricDaily.get(id);
    if (!state) {
      state = new PsmMetricDaily(
        id,
        path,
        dateKey,
        BigInt(data.blockHeight),
        new Date(block.block.header.time as any),
      );
    }
    return state;
  }

  
  async function savePsmGovernance(payload: any) {
    const psmGovernance = new PsmGovernance(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      path.split('.')[3],
      path.split('.')[3],
      BigInt(payload.current.MintLimit.value.__value),
      BigInt(payload.current.GiveMintedFee?.value?.denominator?.__value ?? 0),
      BigInt(payload.current.GiveMintedFee?.value?.numerator?.__value ?? 0),
      BigInt(payload.current.WantMintedFee?.value?.denominator?.__value ?? 0),
      BigInt(payload.current.WantMintedFee?.value?.numerator?.__value ?? 0)
    );
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

    recordSaves.push(reserveMetric.save());

    for (const key in payload.allocations) {
      if (payload.allocations.hasOwnProperty(key)) {
        const allocation = payload.allocations[key];
        // Save daily metrics
        saveReserveAllocationMetricDaily(payload, allocation, key);

        const reserveAllocationMetric = new ReserveAllocationMetrics(
          `${path}:${key}`,
          BigInt(data.blockHeight),
          block.block.header.time as any,
          extractBrand(allocation.__brand),
          key,
          BigInt(allocation.__value),
          reserveMetric.id
        );

        recordSaves.push(reserveAllocationMetric.save());
      }
    }
  }

  async function saveReserveAllocationMetricDaily(payload: any, allocation: any, key: string) {
    const dateKey = dateToDayKey(block.block.header.time);
  
    let state = await getReserveAllocationMetricDaily(path, dateKey);
  
    state.token = allocation.__brand;
    state.key = key;
    state.valueLast = BigInt(allocation.__value);
    state.valueSum = (state.valueSum ?? BigInt(0)) + BigInt(allocation.__value);
    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    recordSaves.push(state.save());
  }
  
  async function getReserveAllocationMetricDaily(path: string, dateKey: number): Promise<ReserveAllocationMetricsDaily> {
    const id = path + ':' + dateKey.toString();
    let state = await ReserveAllocationMetricsDaily.get(id);
    if (!state) {
      state = new ReserveAllocationMetricsDaily(
        id,
        path,
        dateKey,
        BigInt(data.blockHeight),
        new Date(block.block.header.time as any),
      );
    }
    return state;
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
      // First save daily Oracle Prices
      saveOraclePriceDaily(payload, typeInName, typeOutName);
      
      // Save the Oracle Price
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
      recordSaves.push(oraclePrice.save());
    }
  }

  async function saveOraclePriceDaily(payload: any, typeInName: string, typeOutName: string) {
    const dateKey = dateToDayKey(block.block.header.time);
  
    let state = await getOraclePriceDaily(path, dateKey);
  
    state.priceFeedName = path.split('published.priceFeed.')[1];

    state.typeInAmountLast = BigInt(BigInt(payload.amountIn.__value),);
    state.typeInAmountSum = (state.typeInAmountSum ?? BigInt(0)) + BigInt(payload.amountIn.__value);

    state.typeOutAmountLast = BigInt(BigInt(payload.amountOut.__value),);
    state.typeOutAmountSum = (state.typeOutAmountSum ?? BigInt(0)) + BigInt(payload.amountOut.__value);

    state.typeInName = typeInName;
    state.typeOutName = typeOutName;

    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    recordSaves.push(state.save());
  }
  
  async function getOraclePriceDaily(path: string, dateKey: number): Promise<OraclePriceDaily> {
    const id = path + ':' + dateKey.toString();
    let state = await OraclePriceDaily.get(id);
    if (!state) {
      state = new OraclePriceDaily(
        id,
        path,
        dateKey,
        BigInt(data.blockHeight),
        new Date(block.block.header.time as any),
      );
    }
    return state;
  }

  async function saveVaultManagerMetrics(payload: any) {
    saveVaultManagerMetricsDaily(payload);

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
    recordSaves.push(vaultManagerMetric.save());
  }

  async function saveVaultManagerMetricsDaily(payload: any) {
    const dateKey = dateToDayKey(block.block.header.time);

    const state = await getVaultManagerMetricsDaily(path, dateKey);

    state.liquidatingCollateralBrand = extractBrand(payload.liquidatingCollateral.__brand);
    state.liquidatingDebtBrand = extractBrand(payload.liquidatingDebt.__brand);

    state.liquidatingCollateralValueLast = BigInt(payload.liquidatingCollateral.__value);
    state.liquidatingDebtValueLast = BigInt(payload.liquidatingDebt.__value);
    state.lockedQuoteDenominatorLast = BigInt(payload.lockedQuote?.denominator.__value ?? 0);
    state.lockedQuoteNumeratorLast = BigInt(payload.lockedQuote?.numerator.__value ?? 0);
    state.numActiveVaultsLast = BigInt(payload.numActiveVaults);
    state.numLiquidatingVaultsLast = BigInt(payload.numLiquidatingVaults);
    state.numLiquidationsAbortedLast = BigInt(payload.numLiquidationsAborted);
    state.numLiquidationsCompletedLast = BigInt(payload.numLiquidationsCompleted);
    state.retainedCollateralLast = BigInt(payload.retainedCollateral.__value);
    state.totalCollateralLast = BigInt(payload.totalCollateral.__value);
    state.totalCollateralSoldLast = BigInt(payload.totalCollateralSold.__value);
    state.totalDebtLast = BigInt(payload.totalDebt.__value);
    state.totalOverageReceivedLast = BigInt(payload.totalOverageReceived.__value);
    state.totalProceedsReceivedLast = BigInt(payload.totalProceedsReceived.__value);
    state.totalShortfallReceivedLast = BigInt(payload.totalShortfallReceived.__value);
  
    state.liquidatingCollateralValueSum = (state.liquidatingCollateralValueSum ?? BigInt(0)) + BigInt(payload.liquidatingCollateral.__value);
    state.liquidatingDebtValueSum = (state.liquidatingDebtValueSum ?? BigInt(0)) + BigInt(payload.liquidatingDebt.__value);
    state.lockedQuoteDenominatorSum = (state.lockedQuoteDenominatorSum ?? BigInt(0)) + BigInt(payload.lockedQuote?.denominator.__value ?? 0);
    state.lockedQuoteNumeratorSum = (state.lockedQuoteNumeratorSum ?? BigInt(0)) + BigInt(payload.lockedQuote?.numerator.__value ?? 0);
    state.numActiveVaultsSum = (state.numActiveVaultsSum ?? BigInt(0)) + BigInt(payload.numActiveVaults);
    state.numLiquidatingVaultsSum = (state.numLiquidatingVaultsSum ?? BigInt(0)) + BigInt(payload.numLiquidatingVaults);
    state.numLiquidationsAbortedSum = (state.numLiquidationsAbortedSum ?? BigInt(0)) + BigInt(payload.numLiquidationsAborted);
    state.numLiquidationsCompletedSum = (state.numLiquidationsCompletedSum ?? BigInt(0)) + BigInt(payload.numLiquidationsCompleted);
    state.retainedCollateralSum = (state.retainedCollateralSum ?? BigInt(0)) + BigInt(payload.retainedCollateral.__value);
    state.totalCollateralSum = (state.totalCollateralSum ?? BigInt(0)) + BigInt(payload.totalCollateral.__value);
    state.totalCollateralSoldSum = (state.totalCollateralSoldSum ?? BigInt(0)) + BigInt(payload.totalCollateralSold.__value);
    state.totalDebtSum = (state.totalDebtSum ?? BigInt(0)) + BigInt(payload.totalDebt.__value);
    state.totalOverageReceivedSum = (state.totalOverageReceivedSum ?? BigInt(0)) + BigInt(payload.totalOverageReceived.__value);
    state.totalProceedsReceivedSum = (state.totalProceedsReceivedSum ?? BigInt(0)) + BigInt(payload.totalProceedsReceived.__value);
    state.totalShortfallReceivedSum = (state.totalShortfallReceivedSum ?? BigInt(0)) + BigInt(payload.totalShortfallReceived.__value);

    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    recordSaves.push(state.save());
  }

  async function getVaultManagerMetricsDaily(path: string, dateKey: number): Promise<VaultManagerMetricsDaily>{
    const id = `${path}:${dateKey}`;
    let state = await VaultManagerMetricsDaily.get(id);
    if (!state) {
      state = new VaultManagerMetricsDaily(
        id, path, dateKey, BigInt(data.blockHeight), block.block.header.time as any,
      );
      return state;
    }
    return state;
  }


  const regexFunctionMap = [
    { regex: /^published\.priceFeed\..+price_feed$/, function: savePriceFeed },
    { regex: /^published\.psm\..+\.metrics$/, function: savePsmMetrics },
    { regex: /^published\.psm\..+\.governance$/, function: savePsmGovernance },
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.metrics$/, function: saveVaultManagerMetrics },
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.governance$/, function: saveVaultManagerGovernance },
    { regex: /^published\.reserve\.metrics$/, function: saveReserveMetrics },
    { regex: /^published\.wallet\..+\.current$/, function: saveWallets },
    { regex: /^published\.vaultFactory\.managers\.manager[0-9]+\.vaults\.vault[0-9]+$/, function: saveVaults },
    { regex: /^published\.boardAux\.board[0-9]+$/, function: saveBoardAux }
  ];

  for (let idx = 0; idx < data.values.length; idx++) {
    const rawValue: string = data.values[idx];
    if (!rawValue) {
      continue;
    }

    const value = JSON.parse(rawValue);
    const payload = JSON.parse(value.body.replace(/^#/, ''));

    resolveBrandNamesAndValues(payload);
    try {
      for (const { regex, function: action } of regexFunctionMap) {
        if (path.match(regex)) {
          await action(payload);
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

  await Promise.all(recordSaves);
}