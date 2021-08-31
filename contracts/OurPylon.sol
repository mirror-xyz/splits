// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import { OurStorage } from "./OurStorage.sol";
import { OurManagement } from "./OurManagement.sol";
import { OurIntrospector } from "./OurIntrospector.sol";

contract OurPylon is 
  OurStorage, 
  OurManagement,
  OurIntrospector 
{
  event ProxySetup(address indexed initiator, address[] owners, uint256 threshold, address initializer, address fallbackHandler);

  // This constructor ensures that this contract cannot be modified
  constructor() {
    threshold = 1;
  }
}