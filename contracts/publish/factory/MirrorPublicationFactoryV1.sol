//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../MirrorPublicationV1.sol";
import "../interfaces/IMirrorPublicationV1.sol";
import "./interfaces/IMirrorPublicationFactoryV1.sol";

contract MirrorPublicationFactoryV1 is IMirrorPublicationFactoryV1, Ownable {

    address public mirrorInviteToken;

    modifier onlyInviteToken() {
        require(isInviteToken(), "MirrorPublicationFactoryV1: caller is not the invite token");
        _;
    }

    function setInviteToken(address inviteToken_) onlyOwner external {
        mirrorInviteToken = inviteToken_;
    }

    event PublicationCreated(address publication, string label, address owner);

    function createPublication(
        address owner, 
        string memory label,
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) external override onlyInviteToken returns (address publication) {
        bytes memory bytecode = type(MirrorPublicationV1).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(label));

        assembly {
            publication := create2(0, add(32, bytecode), mload(bytecode), salt)
        }

        IMirrorPublicationV1(publication).initialize(
            owner,
            tokenName,
            tokenSymbol,
            tokenDecimals
        );

        emit PublicationCreated(publication, label, owner);
    }

    function isInviteToken() public view returns (bool) {
        return msg.sender == mirrorInviteToken;
    }
}