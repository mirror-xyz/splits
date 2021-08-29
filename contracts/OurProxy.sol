// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import { OurStorage } from "./OurStorage.sol";

interface IOurFactory {
  function splitter() external returns (address);
  function minter() external returns (address);
  function merkleRoot() external returns (bytes32);
}

/**
 * @title OurProxy (originally SplitProxy)
 * @author MirrorXYZ https://github.com/mirror-xyz/splits - modified by Nick Adamson for Ourz
 *
 * @notice Modified: added OpenZeppelin's Ownable (modified)
 */
contract OurProxy is OurStorage {
  constructor() {
    _pylon = IOurFactory(msg.sender).pylon();
    _splitter = IOurFactory(msg.sender).splitter();
    _minter = IOurFactory(msg.sender).minter();

    merkleRoot = IOurFactory(msg.sender).merkleRoot();

    address(_minter).delegatecall(
      abi.encodeWithSignature("setApprovalsForSplit(address)", owner())
    );
  }

  function minter() public view returns (address) {
    return _minter;
  }

  function splitter() public view returns (address) {
    return _splitter;
  }

  

}
