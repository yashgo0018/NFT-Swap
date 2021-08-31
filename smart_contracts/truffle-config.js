const HDWalletProvider = require('@truffle/hdwallet-provider');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*",
    },
    rinkeby: {
      provider: () => new HDWalletProvider(process.env.MNEMONIC, process.env.RINKEBY_RPC_URL),
      network_id: 4,
      gas: 5500000,        // Ropsten has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 500,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true
    },
  },
  mocha: {},
  compilers: {
    solc: {
      version: "0.8.0",
    }
  },
  db: {
    enabled: false
  }
};
