const Chainfundbatch = artifacts.require("Chainfundbatch");
const ChainFundERC1155 = artifacts.require("ChainFundERC1155"); // Replace with the actual name of your ERC1155 contract

module.exports = async function (deployer) {
  // Deploy Chainfundbatch contract with the address of the existing ERC1155 contract

  // Use the address of the already deployed ERC1155 contract
  const erc1155Instance = await ChainFundERC1155.deployed();

  // Deploy Chainfundbatch and pass the ERC1155 contract address to its constructor
  await deployer.deploy(Chainfundbatch, erc1155Instance.address);
};
