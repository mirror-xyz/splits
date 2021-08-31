// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import {OurStorage} from "./OurStorage.sol";
import {OurManagement} from "./OurManagement.sol";
import {OurIntrospector} from "./OurIntrospector.sol";

contract OurPylon is OurStorage, OurManagement, OurIntrospector {
    address internal _splitter;
    address internal _minter;

    event ProxySetup(
        address indexed initiator,
        address[] owners,
        uint256 threshold,
        address initializer,
        address fallbackHandler
    );

    // This constructor ensures that this contract cannot be modified
    constructor(address splitter_, address minter_) {
        _splitter = splitter_;
        _minter = minter_;
        threshold = 1;
    }

    /// NOTE: If owner calls proxy, they are able to call OurMinter functions,
    /// otherwise it acts like OurSplitter
    fallback() external payable {
        if (isOwner(msg.sender)) {
            address _impl = minter();
            assembly {
                let ptr := mload(0x40)
                calldatacopy(ptr, 0, calldatasize())
                let result := delegatecall(
                    gas(),
                    _impl,
                    ptr,
                    calldatasize(),
                    0,
                    0
                )
                let size := returndatasize()
                returndatacopy(ptr, 0, size)

                switch result
                case 0 {
                    revert(ptr, size)
                }
                default {
                    return(ptr, size)
                }
            }
        } else {
            address _impl = splitter();
            assembly {
                let ptr := mload(0x40)
                calldatacopy(ptr, 0, calldatasize())
                let result := delegatecall(
                    gas(),
                    _impl,
                    ptr,
                    calldatasize(),
                    0,
                    0
                )
                let size := returndatasize()
                returndatacopy(ptr, 0, size)

                switch result
                case 0 {
                    revert(ptr, size)
                }
                default {
                    return(ptr, size)
                }
            }
        }
    }
}
