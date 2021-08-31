// Load Dependencies
const express = require('express');
const dotenv = require('dotenv');
const Web3 = require('web3');
const swapContractABI = require('./abis/SwapContract.json');
const db = require('./database');
const Swap = require('./models/Swap');

// Get ENV Variables
dotenv.config();
const WEB3_URI = process.env.WEB3_URI;
const SWAP_CONTRACT_ADDRESS = process.env.SWAP_CONTRACT_ADDRESS;
const PORT = process.env.NODE_SERVER_PORT;

// connect to DB
db.authenticate()
  .then(() => console.log('Connected To DB Successfully'))
  .catch(err => console.log(`Error: ${err}`));

// Setup web3
const web3 = new Web3(WEB3_URI);
const swapContract = new web3.eth.Contract(swapContractABI, SWAP_CONTRACT_ADDRESS);

swapContract.events.SwapCreated({}).on('data', async ({ transactionHash, returnValues }) => {
  await Swap.create({
    swap_id: returnValues.id,
    creator: returnValues.owner,
    swap_create_transaction: transactionHash,
    contract_1_address: returnValues.contract1Address,
    token_1: returnValues.token1,
    type_1: returnValues.type1,
    contract_2_address: returnValues.contract2Address,
    token_2: returnValues.token2,
    type_2: returnValues.type2
  });
});

swapContract.events.SwapCancelled({}).on('data', async ({ returnValues }) => {
  const swap = (await Swap.findAll({ where: { swap_id: returnValues.id } }))[0]
  if (!swap) return;
  swap.cancelled = true;
  swap.done = true;
  swap.save();
});

swapContract.events.SwapExecuted({}).on('data', async ({ transactionHash, returnValues }) => {
  const swap = (await Swap.findAll({ where: { swap_id: returnValues.id } }))[0]
  if (!swap) return;
  swap.swap_executed_transaction = transactionHash;
  swap.token_2_owner = returnValues.counterParty;
  swap.done = true;
  swap.save();
});

// Setup Server
const app = express();

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));