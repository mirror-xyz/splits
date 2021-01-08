//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

import "./interfaces/IMirrorPublicationV1.sol";

contract MirrorPublicationV1 is IMirrorPublicationV1 {
    event ContributorAdded (
        uint contributorID,
        address account,
        Role role
    );

    event ContributorDisabled (
        uint contributorID,
        address account,
        Role role
    );

    // Required to constrain initialization to factory deployment.
    address public factory;

    uint numContributors;

    mapping (uint => Contributor) contributors;

    mapping(address => uint) private _executors;

    /**
     * @notice Called by factory during deployment.
     * @param creator The creator of the publication
     */
    function initialize(address payable creator) external override returns (uint contributorID) {
        require(
            msg.sender == factory,
            "MirrorPublicationV1: Publications are only initialized during deployment by factory"
        );

        contributorID = _addContributor(creator, Role.ADMIN);
    }

    function addContributor(address payable account, Role role) external onlyRole(Role.ADMIN) returns (uint contributorID) {
        contributorID = _addContributor(account, role);
    }

    function disableContributor(uint contributorID) external onlyRole(Role.ADMIN) {
        Contributor storage contributor = contributors[contributorID];
        contributor.enabled = false;

        emit ContributorDisabled(contributorID, contributor.account, contributor.role);
    }

    function _addContributor(address payable account, Role role) private returns (uint contributorID) {
        contributorID = numContributors++;

        Contributor storage contributor = contributors[contributorID];

        contributor.account = account;
        contributor.role = role;
        contributor.enabled = true;

        if (role == Role.ADMIN) {
            _executors[account] = contributorID;
        }

        emit ContributorAdded(contributorID, account, role);
    }

    function _isExecutorRole(Role role) internal view returns (bool hasRole) {
        uint contributorID = _executors[msg.sender];
        Contributor storage contributor = contributors[contributorID];
        hasRole = contributor.role == role && contributor.enabled;
    }

    modifier onlyRole(Role role) {
        require(_isExecutorRole(role), "Caller does not have the required executive role.");
        _;
    }
}