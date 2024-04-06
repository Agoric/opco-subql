import { subqlTest } from "@subql/testing";
import {
  StateChangeEvent,
  Wallet,
  Vault,
  VaultManagerMetrics,
  ReserveMetrics,
  ReserveAllocationMetrics,
  VaultManagerGovernance,
  OraclePrice,
} from "../types";

subqlTest(
  "Wallet and StateChangeEvent in state_change at block 654",
  654, // block height to process
  [], // dependent entities
  [
    new Wallet(
      "published.wallet.agoric180apa567ssxdc7a7vjqklnyfaq94uk3qe9g00j.current",
      BigInt(654),
      new Date("2024-01-17T20:15:30.674Z"),
      "agoric180apa567ssxdc7a7vjqklnyfaq94uk3qe9g00j"
    ),
    new StateChangeEvent(
      "654:25:0",
      BigInt(654),
      new Date("2024-01-17T20:15:30.674Z"),
      "published.wallet",
      "published.wallet.agoric180apa567ssxdc7a7vjqklnyfaq94uk3qe9g00j.current",
      0,
      '["board05557","board0257","board0074",null,"board02021","board02963",null,"board01422","board04661",null,"board00613","board04149",null,"board05815","board00360",null]',
      '{"liveOffers":[["bid-1705522531200",{"id":"bid-1705522531200","invitationSpec":{"callPipe":[["makeBidInvitation",["$0.Alleged: ATOM brand"]]],"instancePath":["auctioneer"],"source":"agoricContract"},"offerArgs":{"maxBuy":{"brand":"$0","value":"+1000000000000","__brand":"ATOM","__value":"1000000000000"},"offerPrice":{"denominator":{"brand":"$0","value":"+1","__brand":"ATOM","__value":"1"},"numerator":{"brand":"$1.Alleged: IST brand","value":"+1","__brand":"IST","__value":"1"}}},"proposal":{"give":{"Bid":{"brand":"$1","value":"+1000000","__brand":"IST","__value":"1000000"}}}}]],"offerToPublicSubscriberPaths":[["openVault-1705522437474",{"vault":"published.vaultFactory.managers.manager0.vaults.vault0"}],["openVault-1705522440909",{"vault":"published.vaultFactory.managers.manager0.vaults.vault1"}]],"offerToUsedInvitation":[["1705522155009",{"brand":"$2.Alleged: Zoe Invitation brand","value":[{"description":"oracle invitation","handle":"$3.Alleged: InvitationHandle","installation":"$4.Alleged: BundleIDInstallation","instance":"$5.Alleged: InstanceHandle","__handle":"InvitationHandle","__installation":"BundleIDInstallation","__instance":"InstanceHandle"}],"__brand":"Zoe Invitation"}],["ecCharter-1705522175986",{"brand":"$2","value":[{"description":"charter member invitation","handle":"$6.Alleged: InvitationHandle","installation":"$7.Alleged: BundleIDInstallation","instance":"$8.Alleged: InstanceHandle","__handle":"InvitationHandle","__installation":"BundleIDInstallation","__instance":"InstanceHandle"}],"__brand":"Zoe Invitation"}],["ecCommittee-1705522165239",{"brand":"$2","value":[{"description":"Voter0","handle":"$9.Alleged: InvitationHandle","installation":"$10.Alleged: BundleIDInstallation","instance":"$11.Alleged: InstanceHandle","__handle":"InvitationHandle","__installation":"BundleIDInstallation","__instance":"InstanceHandle"}],"__brand":"Zoe Invitation"}],["openVault-1705522437474",{"brand":"$2","value":[{"description":"manager0: MakeVault","handle":"$12.Alleged: InvitationHandle","installation":"$13.Alleged: BundleIDInstallation","instance":"$14.Alleged: InstanceHandle","__handle":"InvitationHandle","__installation":"BundleIDInstallation","__instance":"InstanceHandle"}],"__brand":"Zoe Invitation"}],["openVault-1705522440909",{"brand":"$2","value":[{"description":"manager0: MakeVault","handle":"$15.Alleged: InvitationHandle","installation":"$13","instance":"$14","__handle":"InvitationHandle","__installation":"BundleIDInstallation","__instance":"InstanceHandle"}],"__brand":"Zoe Invitation"}]],"purses":[{"balance":{"brand":"$2","value":[],"__brand":"Zoe Invitation"},"brand":"$2","__brand":"Zoe Invitation"}]}'
    ),
  ],
  "handleStateChangeEvent"
);

subqlTest(
  "Vault and VaultManagerMetrics in state_change at block 630",
  630, // block height to process
  [],
  [
    new VaultManagerMetrics(
      "published.vaultFactory.managers.manager0.metrics",
      BigInt(630),
      new Date("2024-01-17T20:14:14.943Z"),
      "ATOM",
      BigInt(0),
      "IST",
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(2),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(0),
      BigInt(19000000),
      BigInt(0),
      BigInt(13065000),
      BigInt(0),
      BigInt(0),
      BigInt(0)
    ),
    new Vault(
      "published.vaultFactory.managers.manager0.vaults.vault2",
      BigInt(630),
      new Date("2024-01-17T20:14:14.943Z"),
      ""
    ),
  ],
  "handleStateChangeEvent"
);

subqlTest(
  "ReserveMetrics and ReserveAllocationMetrics in state_change at block 1246",
  1246, // block height to process
  [],
  [
    new ReserveMetrics(
      "published.reserve.metrics",
      BigInt(1246),
      new Date("2024-03-28T20:33:14.226Z"),
      BigInt(0),
      BigInt(0),
      BigInt(0)
    ),
    new ReserveAllocationMetrics(
      "published.reserve.metrics:Fee",
      BigInt(1246),
      new Date("2024-03-28T20:33:14.226Z"),
      "IST",
      "Fee",
      BigInt(166443434),
      "published.reserve.metrics"
    ),
  ],

  "handleStateChangeEvent"
);

subqlTest(
  "VaultManagerGovernance in state_change at block 982",
  982, // block height to process
  [],
  [
    new VaultManagerGovernance(
      "published.vaultFactory.managers.manager1.governance",
      BigInt(982),
      new Date("2024-01-17T20:29:32.963Z"),
      BigInt(1000000000),
      BigInt(100),
      BigInt(1),
      BigInt(100),
      BigInt(150),
      BigInt(100),
      BigInt(25),
      BigInt(100),
      BigInt(1),
      BigInt(10000),
      BigInt(50)
    ),
  ],

  "handleStateChangeEvent"
);

subqlTest(
  "OraclePrice in state_change at block 612",
  612, // block height to process
  [],
  [
    new OraclePrice(
      "published.priceFeed.ATOM-USD_price_feed",
      BigInt(612),
      new Date("2024-01-17T20:13:51.004Z"),
      "ATOM-USD_price_feed",
      BigInt(1000000),
      BigInt(12010000),
      "ATOM",
      "USD"
    ),
  ],

  "handleStateChangeEvent"
);
