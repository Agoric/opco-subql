import { OraclePrice, OraclePriceDaily } from "../../types";
import { dateToDayKey } from "../utils";

export const priceFeedEventKit = (block: any, data: any, module: string, path: string) => {
  async function savePriceFeed(payload: any): Promise<Promise<any>[]> {
    const matchTypeInName = path.match(/priceFeed\.(.+?)-/);
    const typeInName = matchTypeInName ? matchTypeInName[1] : undefined;
    const matchTypeOutName = path.match(/-(.+?)_price_feed/);
    const typeOutName = matchTypeOutName ? matchTypeOutName[1] : undefined;

    if (typeInName !== undefined && typeOutName !== undefined) {
      // First save daily Oracle Prices
      const oraclePriceDaily = saveOraclePriceDaily(payload, typeInName, typeOutName);

      // Save the Oracle Price
      const oraclePrice = new OraclePrice(
        path,
        BigInt(data.blockHeight),
        block.block.header.time as any,
        path.split("published.priceFeed.")[1],
        BigInt(payload.amountIn.__value),
        BigInt(payload.amountOut.__value),
        typeInName,
        typeOutName
      ).save();

      return [oraclePrice, oraclePriceDaily];
    }
    return [];
  }

  async function saveOraclePriceDaily(payload: any, typeInName: string, typeOutName: string): Promise<any> {
    const dateKey = dateToDayKey(block.block.header.time);

    let state = await getOraclePriceDaily(path, dateKey);

    state.priceFeedName = path.split("published.priceFeed.")[1];

    state.typeInAmountLast = BigInt(BigInt(payload.amountIn.__value));
    state.typeInAmountSum = (state.typeInAmountSum ?? BigInt(0)) + BigInt(payload.amountIn.__value);

    state.typeOutAmountLast = BigInt(BigInt(payload.amountOut.__value));
    state.typeOutAmountSum = (state.typeOutAmountSum ?? BigInt(0)) + BigInt(payload.amountOut.__value);

    state.typeInName = typeInName;
    state.typeOutName = typeOutName;

    state.metricsCount = (state.metricsCount ?? BigInt(0)) + BigInt(1);
    return state.save();
  }

  async function getOraclePriceDaily(path: string, dateKey: number): Promise<OraclePriceDaily> {
    const id = path + ":" + dateKey.toString();
    let state = await OraclePriceDaily.get(id);
    if (!state) {
      state = new OraclePriceDaily(
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
    savePriceFeed,
  };
};
