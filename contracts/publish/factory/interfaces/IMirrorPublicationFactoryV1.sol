//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

interface IMirrorPublicationFactoryV1 {
    function createPublication(
        address creator, 
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) external returns (address publication);
}