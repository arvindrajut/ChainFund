// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GovernanceNFT is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("ChainFundGovernanceNFT", "CFG") {}

    // Function to mint a new governance NFT
    function mintGovernanceNFT(address to) public returns (uint256){
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(to, newItemId);
        return newItemId;
    }


    function hasGovNFT(address account) public view returns (bool) {
        if(balanceOf(account) > 0){
            return true;
        }
        else{
            return false;
        }
    }

}
