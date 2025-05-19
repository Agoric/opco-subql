const { google } = require('googleapis');

const SPREADSHEET_ID = '15CZGF-GyqfimwZgrkFTIAkp8xEfHlLQhkp83flXqI84';
const SHEET_NAME = 'live!A2'; // First row is for the existing header
const GRAPHQL_ENDPOINT = 'https://index-api.onfinality.io/sq/agoric-labs/internal';

async function appendToGoogleSheet(data) {
  const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json', // Update with your service account key file
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log(`Appending ${data.length} rows to Google Sheets...`);

  try {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: SHEET_NAME,
      valueInputOption: 'USER_ENTERED', // https://developers.google.com/sheets/api/reference/rest/v4/ValueInputOption
      requestBody: { values: data },
    });

    console.log('Data successfully pushed to Google Sheets');
  } catch (error) {
    console.error('Error appending data to Google Sheets:', error.response?.data || error.message);
    throw error;
  }
}

exports.fetchAndStoreTransactions = async (req, res) => {
  try {
    console.log('Fetching all transactions from GraphQL API...');

    let allTransactions = [];
    let hasNextPage = true;
    let endCursor = null;

    do {
      const query = `
        query TransactionsQuery($after: Cursor) {
            fastUsdcTransactions(orderBy: SOURCE_BLOCK_TIMESTAMP_DESC, after: $after) {
              pageInfo {
                endCursor
                hasNextPage
              }
              edges {
                    node {
                      id
                      sourceAddress
                      sourceChainId
                      sourceBlockTimestamp
                      eud
                      usdcAmount
                      status
                      statusHeight
                      contractFee
                      poolFee
                      risksIdentified
                      heightObserved
                      heightAdvanced
                      heightDisbursed
                      timeObserved
                      timeAdvanced
                      timeDisbursed
                    }
                }
            }
        }`;

      console.log(`Fetching page with cursor: ${endCursor}`);
      const response = await fetch(GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { after: endCursor },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`GraphQL request failed: ${response.statusText} - ${errorBody}`);
      }

      const { data, errors } = await response.json();

      if (errors) {
        console.error('GraphQL errors:', JSON.stringify(errors, null, 2));
        throw new Error(`GraphQL query returned errors: ${JSON.stringify(errors)}`);
      }
      if (!data || !data.fastUsdcTransactions) {
        console.warn('No data or fastUsdcTransactions received in page response:', data);
        // Decide if this should be an error or just break the loop
        hasNextPage = false; // Stop if no data is returned
        continue; // Skip processing this page
      }

      // console.log('Raw GraphQL page response:', JSON.stringify(data, null, 2)); // Optional: log each page

      const pageTransactions = data.fastUsdcTransactions.edges.map((edge) => edge.node);
      allTransactions = allTransactions.concat(pageTransactions);
      console.log(`Fetched ${pageTransactions.length} transactions this page. Total: ${allTransactions.length}`);

      hasNextPage = data.fastUsdcTransactions.pageInfo.hasNextPage;
      endCursor = data.fastUsdcTransactions.pageInfo.endCursor;
    } while (hasNextPage);

    console.log(`Finished fetching. Total transactions: ${allTransactions.length}`);

    const rows = allTransactions.map((txn) => {
      // Ensure risksIdentified is handled correctly (null, array, or string)
      let risksIdentifiedStr = txn.risksIdentified;
      if (Array.isArray(txn.risksIdentified)) {
        risksIdentifiedStr = txn.risksIdentified.join(', ');
      } else if (txn.risksIdentified === null || typeof txn.risksIdentified === 'undefined') {
        risksIdentifiedStr = ''; // Represent null/undefined as empty string in the sheet
      }

      return [
        txn.id,
        txn.sourceAddress,
        txn.sourceChainId,
        txn.sourceBlockTimestamp,
        txn.eud,
        txn.usdcAmount,
        txn.status,
        txn.statusHeight,
        txn.contractFee,
        txn.poolFee,
        risksIdentifiedStr,
        txn.heightObserved,
        txn.heightAdvanced,
        txn.heightDisbursed,
        txn.timeObserved,
        txn.timeAdvanced,
        txn.timeDisbursed,
      ];
    });

    await appendToGoogleSheet(rows);

    res.status(200).send('Transactions stored successfully!');
  } catch (error) {
    console.error('Error fetching or storing transactions:', error.response?.data || error.message);
    res.status(500).send('Error fetching or storing transactions');
  }
};
