/** @file test against agoric-3-proposals:latest */
import { subqlTest } from '@subql/testing';
import {
  BoardAux,
  OraclePrice,
  OraclePriceDaily,
  PsmGovernance,
  PsmMetrics,
  PsmMetricsDaily,
  StateChangeEvent,
  Vault,
  VaultStatesDaily,
  Wallet,
} from '../types';

// FIXME observed in A3P:latest but not passing tests
subqlTest(
  'StateChangeEvent in state_change at block 85',
  85,
  [],
  [
    new StateChangeEvent(
      '85:97:4',
      BigInt(85),
      new Date('2024-12-26T12:53:10.730'),
      'published.wallet',
      'published.wallet.agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk',
      4,
      '["board0223"]',
      '{"currentAmount":{"brand":{"@qclass":"slot","iface":"Alleged: USDC_axl brand","index":0},"value":{"@qclass":"bigint","digits":"0"},"__brand":"USDC_axl","__value":"0"},"updated":"balance"}',
    ),
  ],

  'handleStateChangeEvent',
);

subqlTest(
  'Wallet existence on height 1133',
  1133,
  [],
  [
    new Wallet(
      'published.wallet.agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk.current',
      BigInt(1133),
      new Date('2024-12-26T13:26:39.5'),
      'agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk',
    ),
  ],

  'handleStateChangeEvent',
);

const vault = new Vault(
  'published.vaultFactory.managers.manager0.vaults.vault6',
  BigInt(1149),
  new Date('2024-12-26T13:28:09.172'),
  'published.wallet.agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q.current',
);

vault.balance = BigInt(788000000);
vault.lockedValue = BigInt(788000000);
vault.coin = 'ATOM';
vault.denom = 'ATOM';
vault.debt = BigInt(4745610000);
vault.state = 'active';

subqlTest(
  'Vault and VaultStateDailies at height 1149',
  1149,
  [],
  [
    vault,
    new VaultStatesDaily(
      '20241226',
      BigInt(1149),
      new Date('2024-12-26T13:28:09.172'),
      BigInt(1),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
    ),
  ],

  'handleStateChangeEvent',
);

subqlTest(
  'BoardAux at block 652',
  652,
  [],
  [
    new BoardAux(
      'published.boardAux.board0074',
      BigInt(652),
      new Date('2024-12-26T13:10:08.048'),
      'Zoe Invitation',
      'set',
      0,
    ),
    new BoardAux(
      'published.boardAux.board01744',
      BigInt(652),
      new Date('2024-12-26T13:10:08.048'),
      'USDT_axl',
      'nat',
      6,
    ),
    new BoardAux('published.boardAux.board0257', BigInt(652), new Date('2024-12-26T13:10:08.048'), 'IST', 'nat', 6),
    new BoardAux(
      'published.boardAux.board03040',
      BigInt(652),
      new Date('2024-12-26T13:10:08.048'),
      'USDC_axl',
      'nat',
      6,
    ),
  ],

  'handleStateChangeEvent',
);

const oraclePriceDaily = new OraclePriceDaily(
  'ATOM-USD:20241226',
  20241226,
  BigInt(509),
  new Date('2024-12-26T13:05:39.000'),
);

oraclePriceDaily.typeInAmountLast = BigInt(1000000);
oraclePriceDaily.typeInAmountSum = BigInt(1000000);
oraclePriceDaily.typeOutAmountLast = BigInt(12010000);
oraclePriceDaily.typeOutAmountSum = BigInt(12010000);
oraclePriceDaily.typeInName = 'ATOM';
oraclePriceDaily.typeOutName = 'USD';
oraclePriceDaily.metricsCount = BigInt(1);

const oraclePrice = new OraclePrice(
  'ATOM-USD',
  BigInt(509),
  new Date('2024-12-26T13:05:39.056'),
  'ATOM-USD',
  BigInt(1000000),
  BigInt(12010000),
  'ATOM',
  'USD',
);

subqlTest(
  'oraclePrice at block 509',
  509,
  [],
  [oraclePriceDaily, oraclePrice],

  'handleStateChangeEvent',
);

const psmMetricsDaily = new PsmMetricsDaily(
  'published.psm.IST.USDC_axl.metrics:20241226',
  'published.psm.IST.USDC_axl.metrics',
  20241226,
  BigInt(35),
  new Date('2024-12-26T12:49:56.000'),
);

psmMetricsDaily.denom = 'USDC_axl';
psmMetricsDaily.anchorPoolBalanceLast = BigInt(0);
psmMetricsDaily.feePoolBalanceLast = BigInt(0);
psmMetricsDaily.mintedPoolBalanceLast = BigInt(0);
psmMetricsDaily.totalAnchorProvidedLast = BigInt(0);
psmMetricsDaily.totalMintedProvidedLast = BigInt(0);
psmMetricsDaily.metricsCount = BigInt(1);

const psmMetrics = new PsmMetrics(
  'published.psm.IST.USDC_axl.metrics',
  BigInt(35),
  new Date('2024-12-26T12:49:56.863'),
  'USDC_axl',
  'USDC_axl',
  BigInt(0),
  BigInt(0),
  BigInt(0),
  BigInt(0),
  BigInt(0),
);

subqlTest('psmMetrics at block 35', 35, [], [psmMetricsDaily, psmMetrics], 'handleStateChangeEvent');

const psmGovernance = new PsmGovernance(
  'published.psm.IST.USDT_axl.governance',
  BigInt(35),
  new Date('2024-12-26T12:49:56.863'),
  'USDT_axl',
  'USDT_axl',
  BigInt(1000000000),
  BigInt(10000),
  BigInt(0),
  BigInt(10000),
  BigInt(0),
);

subqlTest('psmGovernance at block 35', 35, [], [psmGovernance], 'handleStateChangeEvent');
