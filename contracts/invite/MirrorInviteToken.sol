//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.8;

import {
    ERC20Burnable
} from "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import {Mintable} from "./lib/Mintable.sol";
import {IMirrorENSRegistrar} from "../ens/interfaces/IMirrorENSRegistrar.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MirrorInviteToken
 * @author MirrorXYZ
 *
 *  An ERC20 that grants access to the ENS namespace through a
 *  burn-and-register model.
 */
contract MirrorInviteToken is ERC20Burnable, Mintable, ReentrancyGuard {
    // ============ Mutable Storage ============

    address public ensRegistrar;

    // ============ Events ============

    event InviteTokenBurned(address _address);

    // ============ Constructor ============

    constructor(string memory name, string memory symbol)
        public
        Mintable("Mirror Invite Token", "WRITE")
    {
        _setupDecimals(0);
    }

    // ============ Registration ============

    /**
     * Burns the user's invite token and registers their ENS label.
     * @param label The user's ENS label, e.g. "dev" for dev.mirror.xyz.
     */
    function register(string calldata label) external nonReentrant {
        burn(1);
        IMirrorENSRegistrar(ensRegistrar).register(label, msg.sender);
    }

    // ============ Configuration Management ============

    function setENSRegistrar(address ensRegistrar_) external onlyOwner {
        ensRegistrar = ensRegistrar_;
    }
}
