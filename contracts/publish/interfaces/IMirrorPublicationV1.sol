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

    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address) external view returns (uint);
    function allowance(address, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
    function mint(address to, uint value) external returns (bool);
}