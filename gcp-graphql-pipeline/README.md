# GCP GraphQL Pipeline

## Prerequisites

Get a `service-account.json` from https://console.cloud.google.com/iam-admin/serviceaccounts/details/111331970552820213056/keys?project=simulationlab

## Development

```sh
export GOOGLE_APPLICATION_CREDENTIALS=service-account.json
./test.js
```

## Deployment

```sh
gcloud functions deploy fetchAndStoreTransactions \
    --runtime nodejs22 \
    --trigger-http \
    --allow-unauthenticated \
    --set-env-vars GOOGLE_APPLICATION_CREDENTIALS=service-account.json
```

That will output a URL you can invoke like this,

```
curl -X POST https://us-central1-simulationlab.cloudfunctions.net/fetchAndStoreTransactions
```

That runs every hour right now because of:

```sh
gcloud scheduler jobs create http graphql-job \
    --schedule "every 1 hours" \
    --uri https://us-central1-simulationlab.cloudfunctions.net/fetchAndStoreTransactions \
    --http-method POST
```
