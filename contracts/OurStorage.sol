// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

/**
 * @title OurStorage (originally SplitStorage)
 * @author MirrorXYZ https://github.com/mirror-xyz/splits - modified by Nick Adamson for Ourz
 *
 * @notice Modified: store addresses as constants, add _minter
 */
contract OurStorage {
    bytes32 public merkleRoot;
    uint256 public currentWindow;

    address internal _pylon;

    /// @notice RINKEBY ADDRESS
    address public constant wethAddress =
        0xc778417E063141139Fce010982780140Aa0cD5Ab;

    uint256[] public balanceForWindow;
    mapping(bytes32 => bool) internal claimed;
    uint256 internal depositedInWindow;
}
