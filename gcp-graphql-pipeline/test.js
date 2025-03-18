#!/usr/bin/env node

const { fetchAndStoreTransactions } = require('./index');

const mockReq = {}; // No request body needed
const mockRes = {
  status: (code) => ({
    send: (message) => console.log(`Response: ${code} - ${message}`),
  }),
};

fetchAndStoreTransactions(mockReq, mockRes);
