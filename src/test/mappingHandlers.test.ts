/** @file test against agoric-3-proposals:latest */
import { subqlTest } from '@subql/testing';
import { StateChangeEvent } from '../types';

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
