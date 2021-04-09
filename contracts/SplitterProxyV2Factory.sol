// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

import { SplitterProxyV2 } from "./SplitterProxyV2.sol"

/**
 * @title SplitterProxyV2Factory
 * @author MirrorXYZ
 */
contract SplitterProxyV2Factory {
    // Immutable storage
    address public immutable splitter;
    address public immutable wethAddress;
    // Mutable storage
    bytes32 public merkleRoot;

    constructor(
        address splitter_,
        address wethAddress_
    ) {
        splitter = splitter_;
        wethAddress = wethAddress_;
    }

    function create(bytes32 merkleRoot_)
        external
        returns (address splitterProxy)
    {
        merkleRoot = merkleRoot_;
        splitterProxy = address(new SplitterProxyV2());
        delete merkleRoot;
    }
}
