// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Minimal Interface for ERC20s
 * @author (s):
 * https://github.com/OpenZeppelin/openzeppelin-contracts/tree/master/contracts/token/ERC20
 *
 * @notice Modified for OurMinter.sol
 * @dev Provides ability to 'rescue' ERC20s from a Split contract.
 */

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
  /**
   * @dev Sets `amount` as the allowance of `spender` over the caller's tokens.
   *
   * Returns a boolean value indicating whether the operation succeeded.
   *
   * IMPORTANT: Beware that changing an allowance with this method brings the risk
   * that someone may use both the old and the new allowance by unfortunate
   * transaction ordering. One possible solution to mitigate this race
   * condition is to first reduce the spender's allowance to 0 and set the
   * desired value afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   *
   * Emits an {Approval} event.
   */
  function approve(address spender, uint256 amount) external returns (bool);
}
