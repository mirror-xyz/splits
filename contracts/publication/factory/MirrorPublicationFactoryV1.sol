pragma solidity ^0.8.0;

import "../implementation/MirrorPublicationV1.sol";

contract MirrorPublicationFactoryV1 {
    /**
     * @notice Deploy a new publication, given a contributor and counterfactual address.
     * @param contributor address The first contributor to be added to the publication.
     * @return The address of the deployed publication contract.
     */
    function newPublication(
        address contributor
    ) external returns (address publication) {
        publication = _deployNewPublication(contributor);
    }

    function _deployNewPublication(
        address contributor
    ) internal returns (address publication) {
        // Place creation code publication instance in memory.
        bytes memory bytecode = type(MirrorPublicationV1).creationCode;

        // Salt is derived from the contributor address.
        bytes32 salt = keccak256(abi.encodePacked(contributor));

        // Deploy new publication contract via create2.
        assembly {
            publication := create2(
                0,
                // pass in initialization code.
                add(32, bytecode),
                // pass in init code's length.
                mload(bytecode),
                // pass in the salt value.
                salt
            )

            // Pass along failure message and revert if contract deployment fails.
            if iszero(publication) {
                returndatacopy(0, 0, returndatasize)
                revert(0, returndatasize)
            }
        }

        IMirrorPublicationV1(publication).initialize(contributor);

        emit PublicationCreated(publication, contributor);
    }
}