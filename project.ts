import { CosmosDatasourceKind, CosmosHandlerKind, CosmosProject } from "@subql/types-cosmos";

// Can expand the Datasource processor types via the genreic param
const project: CosmosProject = {
  specVersion: "1.0.0",
  version: "0.0.1",
  name: "agoric-starter",
  description: "This project can be use as a starting point for developing your Cosmos agoric based SubQuery project",
  runner: {
    node: {
      name: "@subql/node-cosmos",
      version: ">=3.0.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    // chainId: "agoriclocal",
    // endpoint: ["http://agoric-subql_agd_1:26657/"],
    // chainId: "agoric-emerynet-8",
    // endpoint: ["https://emerynet.rpc.agoric.net:443"],
    chainId: "agoric-3",
    endpoint: ["https://main-a.rpc.agoric.net:443"],

    chaintypes: new Map([
      [
        "cosmos.slashing.v1beta1",
        {
          file: "./proto/cosmos/slashing/v1beta1/tx.proto",
          messages: ["MsgUnjail"],
        },
      ],
      [
        "cosmos.gov.v1beta1",
        {
          file: "./proto/cosmos/gov/v1beta1/tx.proto",
          messages: ["MsgVoteWeighted"],
        },
      ],
      [
        "cosmos.gov.v1beta1.gov",
        {
          file: "./proto/cosmos/gov/v1beta1/gov.proto",
          messages: ["WeightedVoteOption"],
        },
      ],
    ]),
  },
  dataSources: [
    {
      kind: CosmosDatasourceKind.Runtime,
      // First block of mainnet is 2115669
      // startBlock: 2115669,
      // startBlock: 14347000,
      // startBlock: 12306806,
      // startBlock: 13017175,
      // startBlock: 2115669,
      // Upgrade 8 (launch of Inter Protocol)
      startBlock: 7179262,

      mapping: {
        file: "./dist/index.js",
        handlers: [
          // {
          //     Using block handlers slows your project down as they can be executed with each and every block.
          //     Only use if you need to
          //     handler: 'handleEvent',
          //     kind: CosmosHandlerKind.Block,
          // },
          // {
          //   handler: "handleEvent",
          //   kind: CosmosHandlerKind.Event,
          //   filter: {
          //     type: "transfer",
          //     messageFilter: {
          //       type: "/cosmos.bank.v1beta1.MsgSend",
          //     },
          //   },
          // },
          {
            handler: "handleIbcSendPacketEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "send_packet",
              messageFilter: {
                type: "/ibc.applications.transfer.v1.MsgTransfer",
              },
            },
          },
          {
            handler: "handleIbcReceivePacketEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "recv_packet",
              messageFilter: {
                type: "/ibc.core.channel.v1.MsgRecvPacket",
              },
            },
          },
          {
            handler: "handleStateChangeEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "state_change",
            },
          },
          // Bank Events
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "coinbase",
            },
          },
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "coin_received",
            },
          },
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "coin_spent",
            },
          },
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "burn",
            },
          },
          // {
          //   handler: "handleTransferEvent",
          //   kind: CosmosHandlerKind.Event,
          //   filter: {
          //     type: "transfer",
          //   },
          // },
          // Distribution Events
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "rewards",
            },
          },
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "commission",
            },
          },
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "proposer_reward",
            },
          },
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "withdraw_rewards",
            },
          },
          {
            handler: "handleBalanceEvent",
            kind: CosmosHandlerKind.Event,
            filter: {
              type: "withdraw_commission",
            },
          },
        ],
      },
    },
  ],
};

// Must set default to the project instance
export default project;