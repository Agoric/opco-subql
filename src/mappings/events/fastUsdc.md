# Fast USDC events

## Transaction

Supports queries like,

```graphql
{
  _metadata {
    lastProcessedHeight
  }
  fastUsdcTransactions {
    totalCount
    edges {
      node {
        contractFee
        eud
        nodeId
        id
        poolFee
        sourceAddress
        status
        usdcAmount
      }
    }
  }
  fastUsdcTransaction(id: "0xc81bc6105b60a234c7c50ac17816ebcd5561d366df8bf3be59ff387552761786") {
    id
    sourceAddress
    usdcAmount
    contractFee
    eud
    nodeId
    poolFee
    status
  }
  stateChangeEvents(last: 4) {
    nodes {
      id
    }
  }
}
```

Resulting in something like,

```json
{
  "data": {
    "_metadata": {
      "lastProcessedHeight": 9141
    },
    "fastUsdcTransactions": {
      "totalCount": 3,
      "edges": [
        {
          "node": {
            "contractFee": "1002000",
            "eud": "agoric10rchpd57ggt73kmr5dssunm53jwz75pa8jjtav2ytcgwtr8fn0h5yalx8az423padaek6me30fmhzapsdqm8xwtevy6h5dpnd568jvms89m8v6nxxuexkut3ddnx663nxfuk5qpqjw8vq8",
            "nodeId": "WyJmYXN0X3VzZGNfdHJhbnNhY3Rpb25zIiwiMzE4YzcxMDQtYzgxYS00ZTAyLTliNmYtOTBhYmFiODVkYmZkIl0=",
            "id": "0xc81bc6105b60a234c7c50ac17816ebcd5561d366df8bf3be59ff387552761795",
            "poolFee": "4008000",
            "sourceAddress": "0x9a9eE9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9",
            "status": "DISBURSED",
            "usdcAmount": "2000000000"
          }
        },
        {
          "node": {
            "contractFee": "1002000",
            "eud": "agoric10rchpd57ggt73kmr5dssunm53jwz75pa8jjtav2ytcgwtr8fn0h5yalx8az423pav9nk7unfvvchwenhxdnrsmpevcekxu34wgekgvn4xd5r2mr5dpe8za3h0yenywtw0yehqdpsqqsqlnd2q6",
            "nodeId": "WyJmYXN0X3VzZGNfdHJhbnNhY3Rpb25zIiwiNmIxZjQwODgtOTdmZC00MGJmLWE3YWItY2U3OTZmNjAzNTRhIl0=",
            "id": "0xc81bc6105b60a234c7c50ac17816ebcd5561d366df8bf3be59ff387552761707",
            "poolFee": "4008000",
            "sourceAddress": "0x9a9eE9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9",
            "status": "DISBURSED",
            "usdcAmount": "1600000000"
          }
        },
        {
          "node": {
            "contractFee": "1002000",
            "eud": "agoric10rchpd57ggt73kmr5dssunm53jwz75pa8jjtav2ytcgwtr8fn0h5yalx8az423padehkymr9xyehvcmkxaehwv3swsu8gar6wc6rwupewq6kuunhxe58wdm6dfcrsm3jvdeku6qqyqjvq49q",
            "nodeId": "WyJmYXN0X3VzZGNfdHJhbnNhY3Rpb25zIiwiOTQxMWMyYTgtYjAwYS00ZjgzLWJlY2MtMDU3OTU5YmUwYzk0Il0=",
            "id": "0xc81bc6105b60a234c7c50ac17816ebcd5561d366df8bf3be59ff387552761786",
            "poolFee": "4008000",
            "sourceAddress": "0x9a9eE9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9",
            "status": "DISBURSED",
            "usdcAmount": "1000000000"
          }
        }
      ]
    },
    "fastUsdcTransaction": {
      "id": "0xc81bc6105b60a234c7c50ac17816ebcd5561d366df8bf3be59ff387552761786",
      "sourceAddress": "0x9a9eE9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9e9",
      "usdcAmount": "1000000000",
      "contractFee": "1002000",
      "eud": "agoric10rchpd57ggt73kmr5dssunm53jwz75pa8jjtav2ytcgwtr8fn0h5yalx8az423padehkymr9xyehvcmkxaehwv3swsu8gar6wc6rwupewq6kuunhxe58wdm6dfcrsm3jvdeku6qqyqjvq49q",
      "nodeId": "WyJmYXN0X3VzZGNfdHJhbnNhY3Rpb25zIiwiOTQxMWMyYTgtYjAwYS00ZjgzLWJlY2MtMDU3OTU5YmUwYzk0Il0=",
      "poolFee": "4008000",
      "status": "DISBURSED"
    },
    "stateChangeEvents": {
      "nodes": [
        {
          "id": "6555:18:0"
        },
        {
          "id": "303:17:1"
        },
        {
          "id": "301:22:2"
        },
        {
          "id": "415:18:0"
        }
      ]
    }
  }
}
```
