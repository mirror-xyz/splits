// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

import {SplitProxy} from "./SplitProxy.sol";

/**
 * @title SplitFactory
 * @author MirrorXYZ
 */
contract SplitFactory {
    //======== Immutable storage =========

    address public immutable splitter;
    address public immutable wethAddress;

    //======== Mutable storage =========

    // Gets set within the block, and then deleted.
    bytes32 public merkleRoot;

    //======== Constructor =========

    constructor(address splitter_, address wethAddress_) {
        splitter = splitter_;
        wethAddress = wethAddress_;
    }

    //======== Deploy function =========

    function createSplit(bytes32 merkleRoot_)
        external
        returns (address splitProxy)
    {
        merkleRoot = merkleRoot_;
        splitProxy = address(
            new SplitProxy{salt: keccak256(abi.encode(merkleRoot_))}()
        );
        delete merkleRoot;
    }
}
