//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

interface IMirrorPublicationV1 {
	enum Role {
        ADMIN,
        WRITER
    }

    struct Contributor {
        address payable account;
        Role role;
        bool enabled;
    }

    // function factory() external view returns (address);
    function initialize(address payable creator) external returns (uint contributorID);
}