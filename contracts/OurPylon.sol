// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import {OurSplitter} from "./OurSplitter.sol";
import {OurMinter} from "./OurMinter.sol";
import {OurIntrospector} from "./OurIntrospector.sol";

contract OurPylon is OurSplitter, OurMinter, OurIntrospector {
    // This constructor ensures that this contract cannot be modified
    constructor() {
        threshold = 1;
    }

    /// @dev Setup function sets initial storage of contract.
    /// @param owners_ List of addresses that can execute transactions other than claiming funds.
    function setup(address[] calldata owners_) external {
        // setupOwners checks if the Threshold is already set, therefore preventing that this method is called twice
        setupOwners(owners_);

        emit ProxySetup(tx.origin, owners_);
    }

}
