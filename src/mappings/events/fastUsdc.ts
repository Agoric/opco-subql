import type { TransactionRecord } from '@agoric/fast-usdc/src/types';
import type { StreamCell } from '@agoric/internal/src/lib-chainStorage';
import type { CosmosBlock } from '@subql/types-cosmos';
import assert from 'assert';
import { FastUsdcTransaction, FastUsdcTransactionStatus } from '../../types';
// @ts-ignore not there until after codegen, but codegen won't complete if this errors
import { decodeAddressHook } from '@agoric/cosmic-proto/address-hooks.js';

export const transactionEventKit = (block: CosmosBlock, data: StreamCell, module: string, path: string) => {
  async function saveTransaction(payload: TransactionRecord): Promise<Promise<any>[]> {
    logger.info(`saveTransaction ${JSON.stringify(payload)}`);
    // extract the segment after the last period
    const id = path.split('.').pop();
    assert(id, 'saveTransaction must only be called on transaction paths');

    let t: FastUsdcTransaction;
    if (payload.status === FastUsdcTransactionStatus.OBSERVED) {
      assert(payload['evidence'], 'implied by OBSERVED');
      assert.equal(payload.evidence.txHash, id, 'txHash must match path');
      const decoded = decodeAddressHook(payload.evidence.aux.recipientAddress);
      const { EUD } = decoded.query;
      assert(typeof EUD === 'string', 'EUD must be a string');

      assert(!t, 'transaction already exists');
      t = FastUsdcTransaction.create({
        id,
        eud: EUD,
        sourceAddress: payload.evidence.tx.sender,
        sourceBlockTimestamp: payload.evidence.blockTimestamp,
        sourceChainId: payload.evidence.chainId,
        status: payload.status,
        usdcAmount: payload.evidence.tx.amount,
        risksIdentified: payload.risksIdentified || [],
      });
    } else {
      const found = await FastUsdcTransaction.get(id);
      assert(found, 'no matching transaction');
      t = found;
      t.status = payload.status;
      if (payload.split) {
        t.contractFee = payload.split.ContractFee.value;
        t.poolFee = payload.split.PoolFee.value;
      }
    }

    return [t.save()];
  }

  return { saveTransaction };
};
