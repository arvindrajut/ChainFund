// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ChainFundToken is ERC20 {

    address public owner;
    //uint256 public constant cftTokenID = 1995;

    constructor() ERC20("ChainFundToken", "CFT") {
        owner = msg.sender;
    }

    // Minting CFT
    function mintCFT(uint256 cftAmount, address user) external {
        _mint(user, cftAmount);
        //return cftTokenID;
    }

    // Function for investors to transfer CFT to other registered investors
    function transferCFT(address from , address to, uint256 cftAmount) public {
        _transfer(from, to, cftAmount);
    }

    // Check CFT balance of a user
    function balanceOfUser(address user) public view returns (uint256) {
        return balanceOf(user);
    }

    // Function to burn CFT
    function burnCFT(uint256 amount, address user) external {
        _burn(user, amount);
    }

    // Function to get the total supply of CFT
    function totalCFTSupply() public view returns (uint256) {
        return totalSupply();
    }
}
