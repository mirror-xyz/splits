//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.8;

interface IMirrorENSRegistrar {
    function changeRootnodeOwner(address newOwner_) external;
    function changeInviteToken(address inviteToken_) external;
    function register(string calldata label_, address owner_) external;
    function isAvailable(bytes32 subnode_) external view returns(bool);
    function getENSReverseRegistrar() external view returns (address);
    function ensResolver() external view returns (address);
}
