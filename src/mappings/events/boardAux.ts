import type { CosmosBlock } from '@subql/types-cosmos';
import { BoardAux } from '../../types';
import type { StreamCell } from '@agoric/internal/src/lib-chainStorage';

export const boardAuxEventKit = (block: CosmosBlock, data: StreamCell, module: string, path: string) => {
  async function saveBoardAux(payload: any): Promise<Promise<any>[]> {
    const boardAux = new BoardAux(
      path,
      BigInt(data.blockHeight),
      block.block.header.time as Date,
      payload.allegedName,
      payload.displayInfo.assetKind,
      payload.displayInfo.decimalPlaces ?? 0,
    ).save();

    return [boardAux];
  }

  return { saveBoardAux };
};
