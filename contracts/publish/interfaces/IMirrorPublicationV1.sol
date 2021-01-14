//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

interface IMirrorPublicationV1 {
    function initialize(
        address operator,
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) external;

    function owner() external view returns (address);

    function factory() external view returns (address);

    function addContributor(address account) external;
    function disableContributor(address account) external;

    function transferOwnership(address newOwner) external;
    function renounceOwnership() external;

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function mint(address to, uint value) external returns (bool);
}