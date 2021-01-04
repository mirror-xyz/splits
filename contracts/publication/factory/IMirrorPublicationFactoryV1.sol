pragma solidity ^0.8.0;

interface IMirrorPublicationFactoryV1 {
    event PublicationCreated(address publication, address contributor);

    /**
     * @notice Deploy a new publication, given a contributor and counterfactual address.
     * @param contributor address The first contributor to be added to the publication.
     * @return The address of the deployed publication contract.
     */
    function newPublication(
        address contributor
    ) external returns (address publication);
}