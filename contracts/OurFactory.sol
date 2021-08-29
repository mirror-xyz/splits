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
  address public immutable splitter;
  address public immutable minter;

  //======== Mutable storage =========
  /// @dev Gets set within the block, and then deleted.
  address public splitOwner;
  bytes32 public merkleRoot;

  //======== Constructor =========
  constructor(address splitter_, address minter_) {
    splitter = splitter_;
    minter = minter_;
  }

  //======== Deploy function =========
  function createSplit(bytes32 merkleRoot_, string memory splitRecipients_)
    external
    returns (address ourProxy)
  {
    splitOwner = msg.sender;
    merkleRoot = merkleRoot_;
    ourProxy = address(new OurProxy{ salt: keccak256(abi.encode(merkleRoot_)) }());
    delete merkleRoot;
    delete splitOwner;
    emit ProxyCreated(ourProxy, msg.sender, splitRecipients_);
  }
}
