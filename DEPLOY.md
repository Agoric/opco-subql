# How to deploy

This repo has two deployables:

1. SubSQL Indexer
2. BI pipeline

## SubQL Indexer

It's hosted as an OnFinality Indexer Service.

Log in with GitHub to get access to [agoric-labs](https://indexing.onfinality.io/orgs/agoric-labs/projects/internal/deployments).
If you end up at [app.onfinality.io](https://app.onfinality.io/), that's a different product. Start over from the link above.

### Deploy to staging

Use `yarn subql publish` to build and upload to IPFS. The will print out an IPFS hash and also write it to `.project-cid`.

Take that to the [Staging slot](https://indexing.onfinality.io/orgs/agoric-labs/projects/internal/deployments?slot=staging). If there isn't a live staging deployment you'll need to click **Deploy to Staging Slot**. The _Deployment CID_ field is where that IPFS hash goes. Paste it and the frontend will silently fetch the project.yaml and add an accordian to see the manifest. Click _Next_.

No need to bother with any **Query Service Settings**. Click Next again.

For **Indexer Service Settings**, input the archive node for _Network Endpoints_: https://main-a.rpc.agoric.net:443
Under **Advanced Settings**, ensure these are enabled:

- Enable Historical Data

(The others don't seem to matter much).

Click **Deploy** to start the deployment.

Now let's beef up the indexer. Click **Change Compute Size** to bump it up to 4 or 5. There are diminishing returns since it indexes every block in order, regardless of which worker has fetched what. But with 1 worker we've seen ~14 blocks/second and with 5 workers up to 50 blocks/second. Workers are cheap enough to crank them to the max (5).

We generally index from whatever the `startBlock` is in the `project.ts`. OnFinality has some new [Project Upgrade features](https://academy.subquery.network/indexer/build/project-upgrades.html#schema-migration-requirements)) but we don't have have experience with them, let alone enough to document a process.

### Deploy to production

Validate staging by using GraphQL explorer. It's under the three dot menu as _View on Explorer_. Make sure the data you expect is there.

Skim the logs too for anything surprising. 429s are not suprrising because the archive node RPC rate limits.

Note that their log fetching endpoint returns exactly 100 records no matter what time range you select. We've given them feedback that we'd like to be able to fetch more. If you download logs, the'll be in a idiosynchratic format. You can use a script in this repo to make them more legible,

```sh
cat downloaded-log.json.json | scripts/convert-logs.ts | hl
```

Once you're sure staging is good, you can choose _Promote to Production_ under the three dots.

Be sure to validate production after deployment,

- [explorer](https://explorer.subquery.network/subquery/agoric-labs/internal)
- [FU dashboard](https://fast-usdc-dashboard.pages.dev/)

## BI Pipeline

There's a GCP function that reads all the transactions and puts them in a Google Sheets spreadsheet. We have some graphs and BI reporting there. It's a little janky but if suffices.

When you need to update that, follow the [gcp-graphql-pipeline README](./gcp-graphql-pipeline/README.md).
