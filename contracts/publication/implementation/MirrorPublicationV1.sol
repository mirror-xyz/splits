pragma solidity ^0.8.0;

import "./IMirrorPublicationV1.sol";

contract MirrorPublicationV1 is IMirrorPublicationV1 {
    // Required to constrain initialization to factory deployment.
    address public factory;

    address[] public contributors;

    /**
     * @notice Called by factory during deployment.
     * @param contributor address The first contributor to be added to the publication.
     */
    function initialize(address contributor) external {
        require(
            msg.sender == factory,
            'MirrorPublicationV1: Publications are only initialized during deployment by factory'
        );

        contributors = [contributor];
    }
}