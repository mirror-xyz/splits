// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import {OurSplitter} from "./OurSplitter.sol";
import {OurMinter} from "./OurMinter.sol";
import {OurIntrospector} from "./OurIntrospector.sol";

contract OurPylon is OurSplitter, OurMinter, OurIntrospector {
    // address internal _splitter;
    // address internal _minter;

    // This constructor ensures that this contract cannot be modified
    constructor() {
        // _splitter = splitter_;
        // _minter = minter_;
        threshold = 1;
    }

    /// @dev Setup function sets initial storage of contract.
    /// @param owners_ List of addresses that can execute transactions other than claiming funds.
    function setup(address[] calldata owners_) external {
        // setupOwners checks if the Threshold is already set, therefore preventing that this method is called twice
        setupOwners(owners_);

        emit ProxySetup(tx.origin, owners_);
    }
    // function minter() public view returns (address) {
    //   return _minter;
    // }

    // function splitter() public view returns (address) {
    //   return _splitter;
    // }

    /// NOTE: If owner calls proxy, they are able to call OurMinter functions,
    /// otherwise it acts like OurSplitter
    // fallback() external payable {
    //   if (isOwner(msg.sender)) {
    //     address _impl = minter();
    //     assembly {
    //       let ptr := mload(0x40)
    //       calldatacopy(ptr, 0, calldatasize())
    //       let result := delegatecall(gas(), _impl, ptr, calldatasize(), 0, 0)
    //       let size := returndatasize()
    //       returndatacopy(ptr, 0, size)

    //       switch result
    //       case 0 {
    //         revert(ptr, size)
    //       }
    //       default {
    //         return(ptr, size)
    //       }
    //     }
    //   } else {
    //     address _impl = splitter();
    //     assembly {
    //       let ptr := mload(0x40)
    //       calldatacopy(ptr, 0, calldatasize())
    //       let result := delegatecall(gas(), _impl, ptr, calldatasize(), 0, 0)
    //       let size := returndatasize()
    //       returndatacopy(ptr, 0, size)

    //       switch result
    //       case 0 {
    //         revert(ptr, size)
    //       }
    //       default {
    //         return(ptr, size)
    //       }
    //     }
    //   }
    // }

    // // Plain ETH transfers.
    // receive() external payable virtual {}
}
