//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

import {
    ReentrancyGuard
} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IMirrorENSRegistrar} from "./ens/interfaces/IMirrorENSRegistrar.sol";

/**
 * @title MirrorInviteToken
 * @author MirrorXYZ
 *
 *  An ERC20 that grants access to the ENS namespace through a
 *  burn-and-register model.
 */
contract MirrorInviteToken is Ownable, ERC20, ReentrancyGuard {
    // ============ Mutable Storage ============

    bool public registrable = true;
    address public ensRegistrar;

    // ============ Events ============

    event Registered(string label, address owner);
    event Mint(address indexed to, uint256 amount);

    // ============ Modifiers ============

    modifier canRegister() {
        require(registrable, "MirrorInviteToken: Registration is closed");
        _;
    }

    // ============ Constructor ============

    constructor(string memory name, string memory symbol)
        public
        ERC20("Mirror Invite Token", "WRITE")
    {}

    // ============ Minting ============

    /**
     * @dev Function to mint tokens
     * @param to The address that will receive the minted tokens.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);

        emit Mint(to, amount);
    }

    // ============ Registration ============

    /**
     * Burns the sender's invite token and registers an ENS given label to a given address.
     * @param label The user's ENS label, e.g. "dev" for dev.mirror.xyz.
     * @param owner The address that should own the label.
     */
    function register(string calldata label, address owner)
        external
        nonReentrant
        canRegister
    {
        _burn(msg.sender, 1);
        IMirrorENSRegistrar(ensRegistrar).register(label, owner);
        emit Registered(label, owner);
    }

    /**
     * Given an array of labels and owners, we burn tokens from the sender equal to
     * the length of the array, and register each label to each owner via 1:1 mapping through index.
     * Preconditions: labels and owners arrays should correspond exactly.
     * @param labels The list of ENS labels to register.
     * @param owners The list of addresses that should own the labels.
     */
    function registerBatch(string[] calldata labels, address[] calldata owners)
        external
        nonReentrant
        canRegister
    {
        _burn(msg.sender, labels.length);

        for (uint256 i = 0; i < labels.length; i++) {
            // NOTE: This is duplicated rather than extracted from `register`
            // to ensure no possibility of reentrancy during the loop.
            IMirrorENSRegistrar(ensRegistrar).register(labels[i], owners[i]);
            emit Registered(labels[i], owners[i]);
        }
    }

    // ============ Configuration Management ============

    /**
     * Allows the owner to change the ENS Registrar address.
     */
    function setENSRegistrar(address ensRegistrar_) external onlyOwner {
        ensRegistrar = ensRegistrar_;
    }

    /**
     * Allows the owner to pause registration.
     */
    function setRegistrable(bool registrable_) external onlyOwner {
        registrable = registrable_;
    }
}
