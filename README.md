# OpCo indexer

This uses [SubQuery](https://subquery.network) to index some transfer events and messages on the Agoric chain that are relevant to OpCo.

See also the [Agoric SubQuery project](https://github.com/Agoric/agoric-subql).

## Usage

Explorer URL: https://explorer.subquery.network/subquery/agoric-labs/internal

## Data

The entities currently indexed:

- Fast USDC Transactions

### Performance

Sources of latency:

- Waiting for new blocks. RPC itself can be delayed.
- Processing time of blocks.
- DB delay. OnFinality has some caching which batches DB operations.

Mitigations:

- Index with multiple workers.
  - They allow up to five in **Change Compute Size**
  - In a recent indexing, the rate went from 14 to 50 blocks/sec (from 1 to 5 workers)
    - Diminishing returns are to be expected because the blocks are always processed in order, so workers are often waiting their turn.

## Developing

This should be the same as the [Agoric SubQuery project](https://github.com/Agoric/agoric-subql). See [Developing](https://github.com/Agoric/agoric-subql/blob/main/README.md#developing) in its README.
