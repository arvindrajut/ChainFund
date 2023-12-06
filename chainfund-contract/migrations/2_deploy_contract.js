// const GovernanceNFT1 = artifacts.require("GovernanceNFT1");

// module.exports = function (deployer) {
//   deployer.deploy(GovernanceNFT1);
// };

// 2_deploy_educationplatform.js
var ChainFundToken = artifacts.require("ChainFundToken");
var GovernanceNFT = artifacts.require("GovernanceNFT");
var ChainFundERC1155 = artifacts.require("ChainFundERC1155");

module.exports = function(deployer, network, accounts) {
  deployer.then(async () => {
    const TokenInstance = await ChainFundToken.deployed();
    const govNFTInstance = await GovernanceNFT.deployed();

    return deployer.deploy(ChainFundERC1155, TokenInstance.address, govNFTInstance.address);
});
};
