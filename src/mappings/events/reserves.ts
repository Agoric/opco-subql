import { promises } from "dns";
import { ReserveAllocationMetrics, ReserveAllocationMetricsDaily, ReserveMetrics } from "../../types";
import { dateToDayKey, extractBrand } from "../utils";

export const reservesEventKit = (block: any, data: any, module: string, path: string) => {
  async function saveReserveMetrics(payload: any): Promise<Promise<any>[]> {
    const promises: Promise<void>[] = [];
    const reserveMetric = new ReserveMetrics(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      BigInt(payload.shortfallBalance.__value),
      BigInt(payload.totalFeeBurned.__value),
      BigInt(payload.totalFeeMinted.__value)
    );
    promises.push(reserveMetric.save());

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

        promises.push(reserveAllocationMetric.save());
      }
    }

    return promises;
  }

  async function saveReserveAllocationMetricDaily(payload: any, allocation: any, key: string): Promise<Promise<any>[]> {
    const dateKey = dateToDayKey(block.block.header.time);

    let state = await getReserveAllocationMetricDaily(path, dateKey);

    state.token = allocation.__brand;
    state.key = key;
    state.valueLast = BigInt(allocation.__value);
    state.valueSum = (state.valueSum ?? BigInt(0)) + BigInt(allocation.__value);
    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    return [state.save()];
  }

  async function getReserveAllocationMetricDaily(
    path: string,
    dateKey: number
  ): Promise<ReserveAllocationMetricsDaily> {
    const id = path + ":" + dateKey.toString();
    let state = await ReserveAllocationMetricsDaily.get(id);
    if (!state) {
      state = new ReserveAllocationMetricsDaily(
        id,
        path,
        dateKey,
        BigInt(data.blockHeight),
        new Date(block.block.header.time as any)
      );
    }
    return state;
  }

  return {
    saveReserveMetrics,
  };
};
