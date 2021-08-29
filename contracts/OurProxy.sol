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
    merkleRoot = IOurFactory(msg.sender).merkleRoot();
  }

  event ETHReceived(address indexed sender, uint256 value);
  
  function pylon() public view returns (address) {
    return _pylon;
  }

  fallback() external payable {
    address _impl = pylon();
    assembly {
      let ptr := mload(0x40)
      calldatacopy(ptr, 0, calldatasize())
      let result := delegatecall(gas(), _impl, ptr, calldatasize(), 0, 0)
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
  
  // Plain ETH transfers.
  receive() external payable {
    emit ETHReceived(msg.sender, msg.value);
    depositedInWindow += msg.value;
  }
}
