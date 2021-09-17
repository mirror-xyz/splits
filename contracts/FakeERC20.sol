// SPDX-License-Identifier: GPL-3.0

// FOR TEST PURPOSES ONLY. NOT PRODUCTION SAFE
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";


/**
 * @dev {ERC20} token, including:
 *
 *  - Preminted initial supply
 *  - Ability for holders to burn (destroy) their tokens
 *  - No access control mechanism (for minting/pausing) and hence no governance
 *
 * This contract uses {ERC20Burnable} to include burn capabilities - head to
 * its documentation for details.
 *
 * _Available since v3.4._
 */
contract FakeERC20 is ERC20Burnable {
    /**
     * @dev Mints `initialSupply` amount of token and transfers them to `owner`.
     *
     * See {ERC20-constructor}.
     */
    constructor(address owner) ERC20("Fake20", "FAKE") {
        _mint(owner, 100000000000000000000000000);
    }

    function mint() public {
        _mint(msg.sender, 100000000000000000000000000);
    }

}