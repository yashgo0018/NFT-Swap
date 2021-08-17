const NFTSwap = artifacts.require('NFTSwap');
const TestNFTToken = artifacts.require('TestNFTToken');

module.exports = (deployer) => {
  deployer.deploy(NFTSwap);

  if (deployer.network != "mainnet") {
    deployer.deploy(TestNFTToken);
  }
}