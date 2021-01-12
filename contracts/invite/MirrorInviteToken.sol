//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./lib/Mintable.sol";
import "../ens/interfaces/IMirrorENSRegistrar.sol";
import "../publish/factory/interfaces/IMirrorPublicationFactoryV1.sol";

contract MirrorInviteToken is ERC20Burnable, Mintable {

    address private _ensRegistrar;
    address private _publicationFactory;

    event InviteTokenBurned(address _address);

    constructor(string memory name, string memory symbol) Mintable(name, symbol) {
        _setupDecimals(0);
    }

    function registrar() external view returns (address) {
        return _ensRegistrar;
    }

    function setRegistrar(address ensRegistrar) onlyOwner external {
        _ensRegistrar = ensRegistrar;
    }

    function register(
        string memory label,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint8 tokenDecimals
    ) external {
        _register(label, tokenName, tokenSymbol, tokenDecimals);
    }

    function _register(
        string memory label,
        string calldata tokenName,
        string calldata tokenSymbol,
        uint8 tokenDecimals
    ) private {
        burn(1);
        
        IMirrorENSRegistrar(_ensRegistrar).register(label, msg.sender);

        IMirrorPublicationFactoryV1(_publicationFactory).createPublication(
            msg.sender,
            tokenName,
            tokenSymbol,
            tokenDecimals
        );
    }
}
