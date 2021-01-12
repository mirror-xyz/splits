//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

import "../MirrorPublicationV1.sol";
import "../interfaces/IMirrorPublicationV1.sol";
import "./interfaces/IMirrorPublicationFactoryV1.sol";

contract MirrorPublicationFactoryV1 is IMirrorPublicationFactoryV1 {

    address public mirrorInviteToken;

    modifier onlyInviteToken() {
        require(isInviteToken(), "MirrorENSRegistrar: caller is not the invite token");
        _;
    }

    event PublicationCreated(address publication, address owner);

    function createPublication(
        address owner, 
        string memory tokenName,
        string memory tokenSymbol,
        uint8 tokenDecimals
    ) external override onlyInviteToken returns (address publication) {
        bytes memory bytecode = type(MirrorPublicationV1).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(owner));

        assembly {
            publication := create2(0, add(32, bytecode), mload(bytecode), salt)
        }

        IMirrorPublicationV1(publication).initialize(
            owner,
            tokenName,
            tokenSymbol,
            tokenDecimals
        );

        emit PublicationCreated(publication, owner);
    }

    function isInviteToken() public view returns (bool) {
        return msg.sender == mirrorInviteToken;
    }
}