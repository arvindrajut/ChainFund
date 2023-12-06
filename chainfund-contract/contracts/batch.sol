// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ChainFundERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Chainfundbatch is ERC1155 {
    using SafeMath for uint256;
    address public owner;
    uint256 public constant CFTID = 0;
    uint256 public constant NFTID = 1;
    uint256 public constant ETHPerCFT = 0.1 ether;
    address[] public registeredInvestors;
    ChainFundERC1155 private CFE;

    modifier onlyRegisteredInvestor() {
        require(CFE.isInvestorRegistered(msg.sender), "Only registered investors can perform this action");
        _;
    }
    constructor(address _erc1155Address) ERC1155("https://chainfund.example/api/token/{id}.json") {
        CFE = ChainFundERC1155(_erc1155Address);
    }

    function batchpurchase() external payable onlyRegisteredInvestor{
        require(msg.value >= ETHPerCFT, "Not enough ETH sent");
        uint256 cftAmount = msg.value / ETHPerCFT;
        require(cftAmount >= 20, "Minimum of 20 CFT required to mint governance NFT");

        uint256[] memory ids = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);
        ids[0] = CFTID;
        ids[1] = NFTID;
        amounts[0] = cftAmount;
        amounts[1] = 1;

        _mintBatch(msg.sender, ids, amounts, "");
    }

        function transferCFTandNFT(address from, address to, uint256 CFTamount) external onlyRegisteredInvestor {
        require(CFE.isInvestorRegistered(to), "Recipient must be a registered investor");
        require(CFTamount >= 20, "Minimum of 20 CFT required to tranfer governance NFT");

        uint256[] memory ids = new uint256[](2);
        uint256[] memory amounts = new uint256[](2);

        ids[0] = CFTID;
        amounts[0] = CFTamount;
        ids[1] = NFTID;
        amounts[1] = 1;
        /***Batch Tranfer***/
        safeBatchTransferFrom(from, to, ids, amounts, "");
    }

    function getbalance(address user, uint256 id) public view returns(uint256){
        return balanceOf(user, id);
    }



}