import type { CosmosBlock } from '@subql/types-cosmos';
import { OraclePrice, OraclePriceDaily } from '../../types';
import { dateToDayKey } from '../utils';
import type { StreamCell } from '@agoric/internal/src/lib-chainStorage';

export const priceFeedEventKit = (block: CosmosBlock, data: StreamCell, module: string, path: string) => {
  async function savePriceFeed(payload: any): Promise<Promise<any>[]> {
    const matchTypeInName = path.match(/priceFeed\.(.+?)-/);
    const typeInName = matchTypeInName ? matchTypeInName[1] : undefined;
    const matchTypeOutName = path.match(/-(.+?)_price_feed/);
    const typeOutName = matchTypeOutName ? matchTypeOutName[1] : undefined;

    if (typeInName !== undefined && typeOutName !== undefined) {
      const id = `${typeInName}-${typeOutName}`;
      // First save daily Oracle Prices
      const oraclePriceDaily = saveOraclePriceDaily(id, payload, typeInName, typeOutName);

      // Save the Oracle Price
      const oraclePrice = new OraclePrice(
        id,
        BigInt(data.blockHeight),
        block.block.header.time as Date,
        id,
        BigInt(payload.amountIn.__value),
        BigInt(payload.amountOut.__value),
        typeInName,
        typeOutName,
      ).save();

      return [oraclePrice, oraclePriceDaily];
    }
    return [];
  }

  async function saveOraclePriceDaily(id: string, payload: any, typeInName: string, typeOutName: string): Promise<any> {
    const dateKey = dateToDayKey(block.block.header.time);

    let state = await getOraclePriceDaily(id, dateKey);

    state.typeInAmountLast = BigInt(BigInt(payload.amountIn.__value));
    state.typeInAmountSum = (state.typeInAmountSum ?? BigInt(0)) + BigInt(payload.amountIn.__value);

    state.typeOutAmountLast = BigInt(BigInt(payload.amountOut.__value));
    state.typeOutAmountSum = (state.typeOutAmountSum ?? BigInt(0)) + BigInt(payload.amountOut.__value);

    state.typeInName = typeInName;
    state.typeOutName = typeOutName;

    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    return state.save();
  }

  async function getOraclePriceDaily(feedName: string, dateKey: number): Promise<OraclePriceDaily> {
    const id = feedName + ':' + dateKey.toString();
    let state = await OraclePriceDaily.get(id);
    if (!state) {
      state = new OraclePriceDaily(id, dateKey, BigInt(data.blockHeight), new Date(block.block.header.time as Date));
    }
    return state;
  }

  return {
    savePriceFeed,
  };
};
