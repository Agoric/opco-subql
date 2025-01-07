import type { CosmosBlock } from '@subql/types-cosmos';
import { PsmGovernance, PsmMetrics, PsmMetricsDaily } from '../../types';
import { dateToDayKey } from '../utils';

export const psmEventKit = (block: CosmosBlock, data: any, module: string, path: string) => {
  async function savePsmMetrics(payload: any): Promise<Promise<any>[]> {
    const psmMetricDaily = savePsmMetricDaily(payload);
    const psmMetric = new PsmMetrics(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as Date,
      path.split('.')[3],
      path.split('.')[3],
      BigInt(payload.anchorPoolBalance.__value),
      BigInt(payload.feePoolBalance.__value),
      BigInt(payload.mintedPoolBalance.__value),
      BigInt(payload.totalAnchorProvided.__value),
      BigInt(payload.totalMintedProvided.__value),
    ).save();

    return [psmMetric, psmMetricDaily];
  }

  async function savePsmMetricDaily(payload: any) {
    const dateKey = dateToDayKey(block.block.header.time);

    let state = await getPsmMetricDaily(dateKey);

    state.denom = path.split('.')[3];

    state.anchorPoolBalanceLast = BigInt(payload.anchorPoolBalance.__value);
    state.feePoolBalanceLast = BigInt(payload.feePoolBalance.__value);
    state.mintedPoolBalanceLast = BigInt(payload.mintedPoolBalance.__value);
    state.totalAnchorProvidedLast = BigInt(payload.totalAnchorProvided.__value);
    state.totalMintedProvidedLast = BigInt(payload.totalMintedProvided.__value);

    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);

    return state.save();
  }

  async function getPsmMetricDaily(dateKey: number): Promise<PsmMetricsDaily> {
    const id = path + ':' + dateKey.toString();
    let state = await PsmMetricsDaily.get(id);
    if (!state) {
      state = new PsmMetricsDaily(
        id,
        path,
        dateKey,
        BigInt(data.blockHeight),
        new Date(block.block.header.time as Date),
      );
    }
    return state;
  }

  async function savePsmGovernance(payload: any): Promise<Promise<any>[]> {
    const psmGovernance = new PsmGovernance(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as Date,
      path.split('.')[3],
      path.split('.')[3],
      BigInt(payload.current.MintLimit.value.__value),
      BigInt(payload.current.GiveMintedFee?.value?.denominator?.__value ?? 0),
      BigInt(payload.current.GiveMintedFee?.value?.numerator?.__value ?? 0),
      BigInt(payload.current.WantMintedFee?.value?.denominator?.__value ?? 0),
      BigInt(payload.current.WantMintedFee?.value?.numerator?.__value ?? 0),
    ).save();
    return [psmGovernance];
  }

  return {
    savePsmMetrics,
    savePsmGovernance,
  };
};
