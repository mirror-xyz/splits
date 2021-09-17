// SPDX-License-Identifier: GPL-3.0

// FOR TEST PURPOSES ONLY. NOT PRODUCTION SAFE
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FakeERC721 is ERC721 {
    constructor() ERC721("Fake721", "FAKE") {}

    function mint(address to, uint256 tokenId) public {
        _safeMint(to, tokenId);
    }
}