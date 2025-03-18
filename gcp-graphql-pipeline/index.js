const { google } = require('googleapis');

const SPREADSHEET_ID = '15CZGF-GyqfimwZgrkFTIAkp8xEfHlLQhkp83flXqI84';
const SHEET_NAME = 'live!A2'; // First row is for the existing header
const GRAPHQL_ENDPOINT = 'https://api.subquery.network/sq/agoric-labs/internal';

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
    console.log('Fetching transactions from GraphQL API...');

    const query = `
        query TransactionsQuery {
            fastUsdcTransactions(orderBy: SOURCE_BLOCK_TIMESTAMP_DESC) {
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

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.statusText}`);
    }

    const { data } = await response.json();
    if (!data) throw new Error('No data received from GraphQL API');

    console.log('Raw GraphQL response:', JSON.stringify(data, null, 2));

    const transactions = data.fastUsdcTransactions.edges.map((edge) => edge.node);
    console.log(`Fetched ${transactions.length} transactions`);

    const rows = transactions.map((txn) => {
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
        Array.isArray(txn.risksIdentified) ? txn.risksIdentified.join(', ') : txn.risksIdentified, // Convert array to string
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
