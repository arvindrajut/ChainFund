// const ChainFundToken1 = artifacts.require("ChainFundToken1");

// module.exports = function (deployer) {
//   deployer.deploy(ChainFundToken1);
// };


// 1_deploy_contracts.js
var ChainFundToken = artifacts.require("ChainFundToken");
var GovernanceNFT = artifacts.require("GovernanceNFT");

module.exports = function(deployer) {
  deployer.deploy(ChainFundToken);
  deployer.deploy(GovernanceNFT);
};