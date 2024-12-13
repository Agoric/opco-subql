/** @file test against agoric-3-proposals:latest */
import { subqlTest } from '@subql/testing';
import { StateChangeEvent, Wallet } from '../types';

// FIXME observed in A3P:latest but not passing tests
subqlTest(
  'StateChangeEvent in state_change at block 627',
  627, // block height to process
  // dependent entities
  [],
  [
    new Wallet(
      'published.wallet.agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk.current',
      BigInt(627),
      new Date('2024-12-09T23:07:18.273Z'),
      'agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk',
    ),
    new StateChangeEvent(
      '627:39:3',
      BigInt(627),
      new Date('2024-12-09T23:07:18.273Z'),
      'published.wallet',
      'published.wallet.agoric1rwwley550k9mmk6uq6mm6z4udrg8kyuyvfszjk.current',
      3,
      '["board05557","board0257","board0074",null,"board05815","board00360"]',
      '{"liveOffers":[["openVault-1733785637736",{"id":"openVault-1733785637736","invitationSpec":{"callPipe":[["getCollateralManager",["$0.Alleged: ATOM brand"]],["makeVaultInvitation"]],"instancePath":["VaultFactory"],"source":"agoricContract"},"proposal":{"give":{"Collateral":{"brand":"$0","value":"+583000000","__brand":"ATOM","__value":"583000000"}},"want":{"Minted":{"brand":"$1.Alleged: IST brand","value":"+3489000000","__brand":"IST","__value":"3489000000"}}}}]],"offerToPublicSubscriberPaths":[["openVault-1733785637736",{"vault":"published.vaultFactory.managers.manager0.vaults.vault4"}]],"offerToUsedInvitation":[["openVault-1733785637736",{"brand":"$2.Alleged: Zoe Invitation brand","value":[{"description":"manager0: MakeVault","handle":"$3.Alleged: InvitationHandle","installation":"$4.Alleged: BundleIDInstallation","instance":"$5.Alleged: InstanceHandle","__handle":"InvitationHandle","__installation":"BundleIDInstallation","__instance":"InstanceHandle"}],"__brand":"Zoe Invitation"}]],"purses":[{"balance":{"brand":"$2","value":[],"__brand":"Zoe Invitation"},"brand":"$2","__brand":"Zoe Invitation"}]}',
    ),
  ],

  'handleStateChangeEvent',
);
