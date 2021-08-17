// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import { OurStorage } from "./OurStorage.sol";
import { IERC721Receiver } from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

interface IOurFactory {
  function splitter() external returns (address);

  function minter() external returns (address);

  function merkleRoot() external returns (bytes32);
}

/**
 * @title OurProxy (originally SplitProxy)
 * @author MirrorXYZ https://github.com/mirror-xyz/splits - modified by Nick Adamson for Ourz
 *
 * @notice Modified: added OpenZeppelin's Ownable (modified) & IERC721Receiver (inherited)
 */
contract OurProxy is OurStorage, IERC721Receiver {
  /// OZ Ownable.sol
  address private _owner;

  constructor() {
    _splitter = IOurFactory(msg.sender).splitter();
    _minter = IOurFactory(msg.sender).minter();
    merkleRoot = IOurFactory(msg.sender).merkleRoot();

    /**
     * @dev Using tx.origin instead of OurFactory to set owner saves gas and is safe in this context
     * NOTE: Modification of OpenZeppelin Ownable.sol
     */
    _setOwner(tx.origin);

    address(_minter).delegatecall(
      abi.encodeWithSignature("setApprovalsForSplit(address)", owner())
    );
  }

  //======== OpenZeppelin =========
  event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);

  /// @notice Transfers ownership of the contract to a new account (`newOwner`).
  function transferOwnership(address newOwner) public {
    require(msg.sender == owner());
    require(newOwner != address(0), "Ownable: new owner is the zero address");

    _setOwner(newOwner);
  }

  /**
   * @dev Leaves the contract without owner. It will not be possible to call
   * `onlyOwner` functions anymore. Can only be called by the current owner.
   *
   * NOTE: Renouncing ownership will leave the contract without an owner,
   * thereby removing any functionality that is only available to the owner.
   */
  function renounceOwnership() public {
    require(msg.sender == owner());
    _setOwner(address(0));
  }

  function _setOwner(address newOwner) private {
    address oldOwner = _owner;
    _owner = newOwner;
    emit OwnershipTransferred(oldOwner, newOwner);
  }

  /// @dev Returns the address of the current owner.
  function owner() public view returns (address) {
    return _owner;
  }

  //======== IERC721Receiver =========
  /**
   * @notice OpenZeppelin IERC721Receiver.sol
   * @dev Allows contract to receive ERC-721s
   */
  function onERC721Received(
    address,
    address,
    uint256,
    bytes calldata
  ) external override returns (bytes4) {
    return this.onERC721Received.selector;
  }

  //======== /OZ =========

  function minter() public view returns (address) {
    return _minter;
  }

  function splitter() public view returns (address) {
    return _splitter;
  }

  /// NOTE: If owner calls proxy, they are able to call OurMinter functions,
  /// otherwise it acts like OurSplitter
  fallback() external payable {
    if (msg.sender == owner()) {
      address _impl = minter();
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
    } else {
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
  }

  // Plain ETH transfers.
  receive() external payable {
    depositedInWindow += msg.value;
  }
}