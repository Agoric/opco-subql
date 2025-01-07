import type { StreamCell } from '@agoric/internal/src/lib-chainStorage';
import { ReserveAllocationMetrics, ReserveAllocationMetricsDaily, ReserveMetrics } from '../../types';
import { dateToDayKey, extractBrand } from '../utils';
import type { CosmosBlock } from '@subql/types-cosmos';

export const reservesEventKit = (block: CosmosBlock, data: StreamCell, module: string, path: string) => {
  async function saveReserveMetrics(payload: any): Promise<Promise<any>[]> {
    const promises: Promise<void>[] = [];
    const reserveMetric = new ReserveMetrics(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as Date,
      BigInt(payload.shortfallBalance.__value),
      BigInt(payload.totalFeeBurned.__value),
      BigInt(payload.totalFeeMinted.__value),
    );
    promises.push(reserveMetric.save());

    for (const key in payload.allocations) {
      if (payload.allocations.hasOwnProperty(key)) {
        const allocation = payload.allocations[key];
        // Save daily metrics
        const brand = extractBrand(allocation.__brand);
        const reserveAllocationMetricDaily = saveReserveAllocationMetricDaily(brand, payload, allocation, key);
        promises.push(reserveAllocationMetricDaily);

        const reserveAllocationMetric = new ReserveAllocationMetrics(
          `${brand}`,
          BigInt(data.blockHeight),
          block.block.header.time as Date,
          brand,
          key,
          BigInt(allocation.__value),
          reserveMetric.id,
        );

        promises.push(reserveAllocationMetric.save());
      }
    }

    return promises;
  }

  async function saveReserveAllocationMetricDaily(
    brand: string,
    payload: any,
    allocation: any,
    key: string,
  ): Promise<any> {
    const dateKey = dateToDayKey(block.block.header.time);

    let state = await getReserveAllocationMetricDaily(brand, dateKey);

    state.denom = allocation.__brand;
    state.key = key;
    state.valueLast = BigInt(allocation.__value);
    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    return state.save();
  }

  async function getReserveAllocationMetricDaily(
    brand: string,
    dateKey: number,
  ): Promise<ReserveAllocationMetricsDaily> {
    const id = brand + ':' + dateKey.toString();
    let state = await ReserveAllocationMetricsDaily.get(id);
    if (!state) {
      state = new ReserveAllocationMetricsDaily(
        id,
        brand,
        dateKey,
        BigInt(data.blockHeight),
        new Date(block.block.header.time as Date),
      );
    }
    return state;
  }

  return {
    saveReserveMetrics,
  };
};
