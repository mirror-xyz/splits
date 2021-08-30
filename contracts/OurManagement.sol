// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

contract OurManagement {
  event AddedOwner(address owner);
  event RemovedOwner(address owner);

  address internal constant SENTINEL_OWNERS = address(0x1);

  mapping(address => address) internal owners;
  uint256 internal ownerCount;
  uint256 internal threshold;

  function requireSelfCall() private view {
      require(msg.sender == address(this), "GS031");
  }

  modifier authorized() {
      // This is a function call as it minimized the bytecode size
      requireSelfCall();
      _;
  }

  /// @dev Setup function sets initial owners of contract.
  /// @param _owners List of Split owners (can mint/manage auctions)
  function setupOwners(address[] memory _owners) internal {
      // Threshold can only be 0 at initialization.
      // Check ensures that setup function can only be called once.
      require(threshold == 0, "Setup has already been completed once.");
      // Initializing Safe owners.
      address currentOwner = SENTINEL_OWNERS;
      for (uint256 i = 0; i < _owners.length; i++) {
          // Owner address cannot be null.
          address owner = _owners[i];
          require(owner != address(0) && owner != SENTINEL_OWNERS && owner != address(this) && currentOwner != owner, "GS203");
          // No duplicate owners allowed.
          require(owners[owner] == address(0), "GS204");
          owners[currentOwner] = owner;
          currentOwner = owner;
      }
      owners[currentOwner] = SENTINEL_OWNERS;
      ownerCount = _owners.length;
      threshold = 1;
  }

  /// @dev Allows to remove an owner 
  /// @notice Removes the owner `owner` from the Split 
  /// @param prevOwner Owner that pointed to the owner to be removed in the linked list
  /// @param owner Owner address to be removed.
  function removeOwner(
      address prevOwner,
      address owner
  ) public {
      // Validate owner address and check that it corresponds to owner index.
      require(owner != address(0) && owner != SENTINEL_OWNERS, "GS203");
      require(owners[prevOwner] == owner, "GS205");
      owners[prevOwner] = owners[owner];
      owners[owner] = address(0);
      ownerCount--;
      emit RemovedOwner(owner);
  }

  /// @dev Allows to swap/replace an owner from the Split with another address.
  /// @notice Replaces the owner `oldOwner` in the Split with `newOwner`.
  /// @param prevOwner Owner that pointed to the owner to be replaced in the linked list
  /// @param oldOwner Owner address to be replaced.
  /// @param newOwner New owner address.
  function swapOwner(
      address prevOwner,
      address oldOwner,
      address newOwner
  ) public {
      // Owner address cannot be null, the sentinel or the Safe itself.
      require(newOwner != address(0) && newOwner != SENTINEL_OWNERS && newOwner != address(this), "GS203");
      // No duplicate owners allowed.
      require(owners[newOwner] == address(0), "GS204");
      // Validate oldOwner address and check that it corresponds to owner index.
      require(oldOwner != address(0) && oldOwner != SENTINEL_OWNERS, "GS203");
      require(owners[prevOwner] == oldOwner, "GS205");
      owners[newOwner] = owners[oldOwner];
      owners[prevOwner] = newOwner;
      owners[oldOwner] = address(0);
      emit RemovedOwner(oldOwner);
      emit AddedOwner(newOwner);
  }

  function isOwner(address owner) public view returns (bool) {
      return owner != SENTINEL_OWNERS && owners[owner] != address(0);
  }

  /// @dev Returns array of owners.
  /// @return Array of Safe owners.
  function getOwners() public view returns (address[] memory) {
      address[] memory array = new address[](ownerCount);

      // populate return array
      uint256 index = 0;
      address currentOwner = owners[SENTINEL_OWNERS];
      while (currentOwner != SENTINEL_OWNERS) {
          array[index] = currentOwner;
          currentOwner = owners[currentOwner];
          index++;
      }
      return array;
  }
}