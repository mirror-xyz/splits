// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import { OurProxy } from "./OurProxy.sol";

/**
 * @title OurFactory (originally SplitFactory)
 * @author MirrorXYZ https://github.com/mirror-xyz/splits - modified by Nick Adamson for Ourz
 *
 * @notice Modified: store OurMinter.sol address, add events, remove WETHaddress in favor of constant
 */
contract OurFactory {
  //======== Graph Protocol =========
  event ProxyCreated(address ourProxy, address proxyOwner, string splitRecipients);

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
  function createSplit(bytes32 merkleRoot_, bytes memory initializer, string memory splitRecipients_)
    external
    returns (address ourProxy)
  {
    merkleRoot = merkleRoot_;
    ourProxy = address(new OurProxy{ salt: keccak256(abi.encode(merkleRoot_)) }());

    // call setup() to set owners
    assembly {
        if eq(call(gas(), ourProxy, 0, add(initializer, 0x20), mload(initializer), 0, 0), 0) {
            revert(0, 0)
        }
    }

    delete merkleRoot;
    emit ProxyCreated(ourProxy, msg.sender, splitRecipients_);
  }
}
