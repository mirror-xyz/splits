//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

interface IENSResolver {
    event AddrChanged(bytes32 indexed _node, address _addr);
    event NameChanged(bytes32 indexed _node, string _name);

    function addr(bytes32 _node) external view returns (address);
    function setAddr(bytes32 _node, address _addr) external;
    function name(bytes32 _node) external view returns (string memory);
    function setName(bytes32 _node, string calldata _name) external;
}
