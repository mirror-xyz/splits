// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import {OurProxy} from "./OurProxy.sol";

/**
 * @title OurFactory
 * @author Nick Adamson - nickadamson@pm.me
 * 
 * Building on the work from:
 * @author Mirror       @title Splits   https://github.com/mirror-xyz/splits
 * @author Gnosis       @title Safe     https://github.com/gnosis/safe-contracts
 * & of course, @author OpenZeppelin
 */
contract OurFactory {
    //======== Subgraph =========
    event ProxyCreated(
        address ourProxy,
        address proxyCreator,
        string splitRecipients,
        string nickname
    );

    //======== Immutable storage =========
    address public immutable pylon;

    //======== Mutable storage =========
    /// @dev Gets set within the block, and then deleted.
    bytes32 public merkleRoot;

    //======== Constructor =========
    constructor(address pylon_) {
        pylon = pylon_;
    }

    //======== Deploy function =========
    function createSplit(
        bytes32 merkleRoot_,
        bytes memory data,
        string calldata splitRecipients_,
        string calldata nickname_
    ) external returns (address ourProxy) {
        merkleRoot = merkleRoot_;
        ourProxy = address(
            new OurProxy{salt: keccak256(abi.encode(merkleRoot_))}()
        );
        delete merkleRoot;

        emit ProxyCreated(ourProxy, msg.sender, splitRecipients_, nickname_);
        
        // call setup() to set owners
        assembly {
            if eq(
                call(gas(), ourProxy, 0, add(data, 0x20), mload(data), 0, 0),
                0
            ) {
                revert(0, 0)
            }
        }
    }
}
