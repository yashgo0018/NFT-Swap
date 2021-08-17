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
      network_id: 4
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
