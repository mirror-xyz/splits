//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

import "../MirrorPublicationV1.sol";
import "../interfaces/IMirrorPublicationV1.sol";

import "./interfaces/IMirrorPublicationFactoryV1.sol";

contract MirrorPublicationFactoryV1 is IMirrorPublicationFactoryV1 {
    event PublicationCreated(address publication, address creator);

    function createPublication(address payable creator) external override returns (address publication) {
        publication = _deployNewPublication(creator);
    }

    function _deployNewPublication(address payable creator) internal returns (address publication) {
        // Place creation code of the instance in memory.
        bytes memory bytecode = type(MirrorPublicationV1).creationCode;

        bytes32 salt = keccak256(abi.encodePacked(creator));

        // Deploy new publication contract via create2.
        assembly {
            publication := create2(0, add(32, bytecode), mload(bytecode), salt)
        }

        IMirrorPublicationV1(publication).initialize(creator);

        emit PublicationCreated(publication, creator);
    }
}