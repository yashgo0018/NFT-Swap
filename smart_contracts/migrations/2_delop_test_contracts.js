const TestNFTToken = artifacts.require('TestNFTToken')
const TestERC1155Token = artifacts.require('TestERC1155Token')

module.exports = deployer => {
  if (deployer.network == 'mainnet') return;
  deployer.deploy(TestNFTToken);
  deployer.deploy(TestERC1155Token);
}