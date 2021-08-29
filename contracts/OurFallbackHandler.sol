// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

contract OurFallbackHandler {
  fallback() external payable {
    address _impl = splitter();
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
  event ETHReceived(address indexed sender, uint256 value);
  receive() external payable {
    emit ETHReceived(msg.sender, msg.value);
    depositedInWindow += msg.value;
  }
}