# Agoric indexer

This uses [SubQuery](https://subquery.network) to index all transfer events and messages on the Agoric chain.

## Usage

Explorer URL: https://explorer.subquery.network/subquery/agoric-labs/agoric-mainnet-v2

API Endpoint: https://api.subquery.network/sq/agoric-labs/agoric-mainnet-v2

The indexer query service is used by the [inter dashboard](https://info.inter.trade/) and [its code](https://github.com/agoric-labs/agoric-inter-dashboard/blob/master/src/queries.ts) includes various examples of query usage.

## Data

The indexer uses state change events to index most of the data also available from vstorage:

- Metadata about the indexer. e.g. lastProcessedHeight
- PSM metrics (minted pool balances, governance parameters)
- Active vault data (count, total balance by collateral type)
- Daily metrics (vault metrics, collateral, debt, oracle prices)
- Reserve metrics (shortfall balances, allocation values)
- Wallets

Note: as of June 13th, 2024, this indexer does not include transactions, account balances, or raw block data.

## Project boilerplate

## Start

First, install SubQuery CLI globally on your terminal by using NPM `npm install -g @subql/cli`

You can either clone this GitHub repo, or use the `subql` CLI to bootstrap a clean project in the network of your choosing by running `subql init` and following the prompts.

Don't forget to install dependencies with `npm install` or `yarn install`!

## Editing your SubQuery project

Although this is a working example SubQuery project, you can edit the SubQuery project by changing the following files:

- The project manifest in `project.ts` defines the key project configuration and mapping handler filters
- The GraphQL Schema (`schema.graphql`) defines the shape of the resulting data that you are using SubQuery to index
- The Mapping functions in `src/mappings/` directory are typescript functions that handle transformation logic

SubQuery supports various layer-1 blockchain networks and provides [dedicated quick start guides](https://academy.subquery.network/quickstart/quickstart.html) as well as [detailed technical documentation](https://academy.subquery.network/build/introduction.html) for each of them.

## Run your project

_If you get stuck, find out how to get help below._

The simplest way to run your project is by running `yarn dev` or `npm run-script dev`. This does all of the following:

1.  `yarn codegen` - Generates types from the GraphQL schema definition and contract ABIs and saves them in the `/src/types` directory. This must be done after each change to the `schema.graphql` file or the contract ABIs
2.  `yarn build` - Builds and packages the SubQuery project into the `/dist` directory
3.  `docker-compose pull && docker-compose up` - Runs a Docker container with an indexer, PostgeSQL DB, and a query service. This requires [Docker to be installed](https://docs.docker.com/engine/install) and running locally. The configuration for this container is set from your `docker-compose.yml`

You can observe the three services start, and once all are running (it may take a few minutes on your first start), please open your browser and head to [http://localhost:3000](http://localhost:3000) - you should see a GraphQL playground showing with the schemas ready to query. [Read the docs for more information](https://academy.subquery.network/run_publish/run.html) or [explore the possible service configuration for running SubQuery](https://academy.subquery.network/run_publish/references.html).

## Query your project

For this project, you can try to query with the following GraphQL code to get a taste of how it works.

```graphql
{
  query {
    transferEvents(first: 5) {
      nodes {
        id
        blockHeight
        txHash
        recipient
        sender
        amount
      }
    }
    messages(first: 5) {
      nodes {
        id
        blockHeight
        txHash
        from
        to
        amount
      }
    }
  }
}
```

You can explore the different possible queries and entities to help you with GraphQL using the documentation draw on the right.

## Publish your project

SubQuery is open-source, meaning you have the freedom to run it in the following three ways:

- Locally on your own computer (or a cloud provider of your choosing), [view the instructions on how to run SubQuery Locally](https://academy.subquery.network/run_publish/run.html)
- By publishing it to our enterprise-level [Managed Service](https://managedservice.subquery.network), where we'll host your SubQuery project in production ready services for mission critical data with zero-downtime blue/green deployments. We even have a generous free tier. [Find out how](https://academy.subquery.network/run_publish/publish.html)
- [Coming Soon] By publishing it to the decentralised [SubQuery Network](https://subquery.network/network), the most open, performant, reliable, and scalable data service for dApp developers. The SubQuery Network indexes and services data to the global community in an incentivised and verifiable way

## What Next?

Take a look at some of our advanced features to take your project to the next level!

- [**Multi-chain indexing support**](https://academy.subquery.network/build/multi-chain.html) - SubQuery allows you to index data from across different layer-1 networks into the same database, this allows you to query a single endpoint to get data for all supported networks.
- [**Dynamic Data Sources**](https://academy.subquery.network/build/dynamicdatasources.html) - When you want to index factory contracts, for example on a DEX or generative NFT project.
- [**Project Optimisation Advice**](https://academy.subquery.network/build/optimisation.html) - Some common tips on how to tweak your project to maximise performance.
- [**GraphQL Subscriptions**](https://academy.subquery.network/run_publish/subscription.html) - Build more reactive front end applications that subscribe to changes in your SubQuery project.

## Need Help?

The fastest way to get support is by [searching our documentation](https://academy.subquery.network), or by [joining our discord](https://discord.com/invite/subquery) and messaging us in the `#technical-support` channel.

### CosmosHandlerKind.Event Filter Types

- active_proposal
- burn
- coin_received
- coin_spent
- coinbase
- commission
- message
- mint
- proposal_deposit
- proposal_vote
- proposer_reward
- rewards
- state_change
- storage
- submit_proposal
- transfer

## Developing

### With A3P

1. Start up an A3P instance

   ```sh
   docker run -p 26657:26657 -p 1317:1317 -p 9090:9090 ghcr.io/agoric/agoric-3-proposals:latest
   ```

   Or with a proposal that you've built in a3p-integration,

   ```sh
   docker run -p 26657:26657 -p 1317:1317 -p 9090:9090 ghcr.io/agoric/agoric-3-proposals:use-fast-usdc
   ```

2. Confirm the data is visible with [vstorage viewer](https://vstorage.agoric.net/?endpoint=http%3A%2F%2Flocalhost%3A26657)

3. Start up the Indexer
   After the A3P instance is up and running, initiate the indexer with the following command:

   ```sh
   AGORIC_NET=docker yarn dev
   ```

4. Access the GraphQL playground
   Once the indexer is operational, access the GraphQL interface to query indexed data:

   - Open a web browser and navigate to http://localhost:3000.
   - Use the provided interface to write and execute your GraphQL queries.

### With multichain-testing

Make some transactions.

```sh
cd multichain-testing && yarn
make setup # if you've never ran starship
docker pull ghcr.io/agoric/agoric-sdk:dev # to make sure you have the latest IBC hooks changes
make stop
make start FILE=config.fusdc.yaml # wait ~7 mins
yarn test:fast-usdc test/fast-usdc/fast-usdc.test.ts
```

View [published.fastUsdc](https://vstorage.agoric.net/?endpoint=http%3A%2F%2Flocalhost%3A26657&path=published.fastUsdc)

Start a fresh indexer:

```sh
scripts/restart-dev.sh
```

Play at http://localhost:3000/

Cleanup…

```sh
cd multichain-testing
make stop
```

### Troubleshooting the Indexer

If you encounter issues with the indexer:

- Check the logs of indexer for any errors or warnings that might indicate what is wrong. Use the command:

  ```sh
  docker logs -f agoric-subql-subquery-node-1
  ```

- If restarting the indexer is necessary, first delete the `.data` folder in the root directory to avoid conflicts or corruption of data:

  ```sh
  rm -rf .data
  ```

## Testing

When a PR is created, tests associated with indexing are automatically triggered in the following workflows:

- `.github/workflows/pr.yaml`
- `.github/workflows/liquidation.yaml`
- `.github/workflows/vaults-and-reserve-metrics-testing.yml`

These tests are scheduled to run daily and can also be manually triggered at any time from the GitHub Actions tab on GitHub.
