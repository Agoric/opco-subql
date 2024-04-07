import { PsmGovernance, PsmMetric, PsmMetricDaily } from "../../types";
import { dateToDayKey } from "../utils";

export const psmEventKit = (block: any, data: any, module: string, path: string) => {
  async function savePsmMetrics(payload: any): Promise<Promise<any>[]> {
    const psmMetricDaily = savePsmMetricDaily(payload);
    const psmMetric = new PsmMetric(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      path.split(".")[3],
      path.split(".")[3],
      BigInt(payload.anchorPoolBalance.__value),
      BigInt(payload.feePoolBalance.__value),
      BigInt(payload.mintedPoolBalance.__value),
      BigInt(payload.totalAnchorProvided.__value),
      BigInt(payload.totalMintedProvided.__value)
    ).save();

    return [psmMetric, psmMetricDaily];
  }

  async function savePsmMetricDaily(payload: any) {
    const dateKey = dateToDayKey(block.block.header.time);

    let state = await getPsmMetricDaily(dateKey);

    state.token = path.split(".")[3];

    state.anchorPoolBalanceLast = BigInt(payload.anchorPoolBalance.__value);
    state.feePoolBalanceLast = BigInt(payload.feePoolBalance.__value);
    state.mintedPoolBalanceLast = BigInt(payload.mintedPoolBalance.__value);
    state.totalAnchorProvidedLast = BigInt(payload.totalAnchorProvided.__value);
    state.totalMintedProvidedLast = BigInt(payload.totalMintedProvided.__value);

    state.anchorPoolBalanceSum = (state.anchorPoolBalanceSum ?? BigInt(0)) + BigInt(payload.anchorPoolBalance.__value);
    state.feePoolBalanceSum = (state.feePoolBalanceSum ?? BigInt(0)) + BigInt(payload.feePoolBalance.__value);
    state.mintedPoolBalanceSum = (state.mintedPoolBalanceSum ?? BigInt(0)) + BigInt(payload.mintedPoolBalance.__value);
    state.totalAnchorProvidedSum =
      (state.totalAnchorProvidedSum ?? BigInt(0)) + BigInt(payload.totalAnchorProvided.__value);
    state.totalMintedProvidedSum =
      (state.totalMintedProvidedSum ?? BigInt(0)) + BigInt(payload.totalMintedProvided.__value);
    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);

    return state.save();
  }

  async function getPsmMetricDaily(dateKey: number): Promise<PsmMetricDaily> {
    const id = path + ":" + dateKey.toString();
    let state = await PsmMetricDaily.get(id);
    if (!state) {
      state = new PsmMetricDaily(id, path, dateKey, BigInt(data.blockHeight), new Date(block.block.header.time as any));
    }
    return state;
  }

  async function savePsmGovernance(payload: any): Promise<Promise<any>[]> {
    const psmGovernance = new PsmGovernance(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      path.split(".")[3],
      path.split(".")[3],
      BigInt(payload.current.MintLimit.value.__value),
      BigInt(payload.current.GiveMintedFee?.value?.denominator?.__value ?? 0),
      BigInt(payload.current.GiveMintedFee?.value?.numerator?.__value ?? 0),
      BigInt(payload.current.WantMintedFee?.value?.denominator?.__value ?? 0),
      BigInt(payload.current.WantMintedFee?.value?.numerator?.__value ?? 0)
    ).save();
    return [psmGovernance];
  }

  return {
    savePsmMetrics,
    savePsmGovernance,
  };
};
