// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "./ChainFundToken.sol";
import "./GovernanceNFT.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract ChainFundERC1155 is ERC1155 {
    using SafeMath for uint256;
    address public owner;
    uint256 public constant ETHPerCFT = 0.1 ether;
    address[] public registeredInvestors;
    uint256 public btcratio = 50;
    uint256 public usdtratio = 50;

    ChainFundToken private cftToken;
    GovernanceNFT private govNFT;

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _; }

    modifier onlyRegisteredInvestor() {
        require(isInvestorRegistered(msg.sender), "Only registered investors can perform this action");
        _;
    }
    modifier onlyGoverningInvestors() {
        require(hasGovernanceNFT(msg.sender), "Only registered investors can perform this action");
        _;
    }

    constructor(address _erc20Address, address _erc721Address) ERC1155("https://chainfund.example/api/token/{id}.json") {
        owner = msg.sender;
        cftToken = ChainFundToken(_erc20Address);
        govNFT = GovernanceNFT(_erc721Address);
    }

    struct regInvestor {
        uint256 weight;
        bool voted;
        uint256 vote;
    }
    mapping(address => regInvestor) regInvestors;
    struct Proposal {
        uint256 voteCount;
    }

    Proposal btc;
    Proposal usdt;
    Proposal[] proposals;
    function initializeProposals() public onlyGoverningInvestors {
        proposals.push(btc); 
        proposals.push(usdt);
    }
    // Function to register investors
    function registerInvestor() external {
        require(!isInvestorRegistered(msg.sender), "Investor is already registered");
        registeredInvestors.push(msg.sender);
        cftToken.mintCFT(0, msg.sender);
        regInvestors[msg.sender].voted= false; 
        regInvestors[msg.sender].weight=0;
    }

    function vote(uint256 toProposal) public onlyRegisteredInvestor {
        regInvestor storage sender = regInvestors[msg.sender];
        require(!sender.voted, "Vote Denied: This user has already casted a vote!");
        require(toProposal == 0 || toProposal == 1, "Invalid Vote: The vote proposal entered is invalid!");
        sender.voted = true;
        sender.vote = toProposal;
        proposals[toProposal].voteCount += sender.weight;
    }

    function getwinningproposal() public view returns (uint256 winningProposal) {
        uint256 halfSupply = cftToken.totalCFTSupply() / 2;
        uint256 winningVoteCount = 0;

        for (uint256 prop = 0; prop < proposals.length; prop++)
            if (proposals[prop].voteCount > winningVoteCount && proposals[prop].voteCount >= halfSupply) {
                winningVoteCount = proposals[prop].voteCount;
                winningProposal = prop;
            }

        assert(winningVoteCount >= halfSupply);
    }
    
function executeProposal() public onlyOwner {
    uint256 winningProposal = getwinningproposal();
    require(winningProposal != type(uint256).max, "No clear winner yet");

    if (winningProposal == 0) {
        btcratio += 10;
        usdtratio -= 10;
    } else {
        btcratio -= 10;
        usdtratio += 10;
    }
}

    function getCFTComposition() public view returns(uint256, uint256) {
        return (btcratio, usdtratio);
 }


    // Function to check if an investor is registered
    function isInvestorRegistered(address investor) public view returns (bool) {
        for (uint256 i = 0; i < registeredInvestors.length; i++) {
            if (registeredInvestors[i] == investor) {
                return true;
            }
        }
        return false;
    }

    // Function to buy CFT directly in ERC1155 contract
    function buyCFT() public payable onlyRegisteredInvestor {
        require((msg.value) >= ETHPerCFT, "Not enough ETH sent");
        uint256 cftAmount = msg.value / ETHPerCFT;
        cftToken.mintCFT(cftAmount, msg.sender);
        regInvestors[msg.sender].weight=CFTbalance(msg.sender);
    }


    function CFTbalance(address user) public view returns (uint256) {
        return cftToken.balanceOf(user);
    }

    // Function to transfer CFT tokens to another user (only registered investors)
    function transferCFT(address to, uint256 cftAmount) external onlyRegisteredInvestor {
        require(isInvestorRegistered(to), "Recipient must be a registered investor");
        cftToken.transferCFT(msg.sender, to, cftAmount);
        regInvestors[msg.sender].weight=CFTbalance(msg.sender);
    }

    // Function for users to withdraw ETH based on their CFT holdings
    function withdraw(uint256 cftAmount) public onlyRegisteredInvestor {
        require(cftToken.balanceOfUser(msg.sender) >= cftAmount, "Insufficient CFT balance");
        uint256 ethAmount = cftAmount * ETHPerCFT;
        require(address(this).balance >= ethAmount, "Insufficient ETH in contract");
        cftToken.burnCFT(cftAmount, msg.sender);
        payable(msg.sender).transfer(ethAmount);
    }

    function totalCFTSupply() public view returns (uint256) {
        return cftToken.totalCFTSupply();
    }

    //Function to mint 5% of total CFT supply and distribute as dividends to registered investors
    function distributeDividends() public onlyOwner {
        uint256 totalSupply = cftToken.totalCFTSupply();
        uint256 dividendAmount = (totalSupply * 5) / 100; // 5% of total supply

        require(dividendAmount > 0, "No dividends available to distribute");

        for (uint256 i = 0; i < registeredInvestors.length; i++) {
            address investor = registeredInvestors[i];
            uint256 investorBalance = cftToken.balanceOfUser(investor);
            uint256 investorDividend = (investorBalance * dividendAmount) / totalSupply;

            if (investorDividend > 0) {
                cftToken.mintCFT(investorDividend, investor);
            }
        }
    }


    function getGovernanceNFT(address user) public  onlyRegisteredInvestor {
        require(isInvestorRegistered(user), "Recipient must be a registered investor");
        require(CFTbalance(user) >= 20, "User Does not Hold qualifying amount of CFT for Governance ");
        govNFT.mintGovernanceNFT(user);
    }

    function hasGovernanceNFT(address user) public view returns (bool) {
        return govNFT.hasGovNFT(user);
    }    

}
