import { BoardAux } from "../../types";

export const boardAuxEventKit = (block: any, data: any, module: string, path: string) => {
  async function saveBoardAux(payload: any): Promise<Promise<any>[]> {
    const boardAux = new BoardAux(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as any,
      payload.allegedName,
      payload.displayInfo.assetKind,
      payload.displayInfo.decimalPlaces ?? 0
    ).save();
    // logger.info("boardAux: " + JSON.stringify(boardAux));
    return [boardAux];
  }

  return { saveBoardAux };
};
