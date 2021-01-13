//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./lib/Mintable.sol";
import "../ens/interfaces/IMirrorENSRegistrar.sol";
import "../publish/factory/interfaces/IMirrorPublicationFactoryV1.sol";

contract MirrorInviteToken is ERC20Burnable, Mintable {

    address public ensRegistrar;
    address public publicationFactory;

    event InviteTokenBurned(address _address);

    constructor(string memory name, string memory symbol) Mintable(name, symbol) {
        _setupDecimals(0);
    }

    function setENSRegistrar(address ensRegistrar_) onlyOwner external {
        ensRegistrar = ensRegistrar_;
    }

    function setPublicationFactory(address publicationFactory_) onlyOwner external {
        publicationFactory = publicationFactory_;
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
        
        IMirrorENSRegistrar(ensRegistrar).register(label, msg.sender);

        IMirrorPublicationFactoryV1(publicationFactory).createPublication(
            msg.sender,
            label,
            tokenName,
            tokenSymbol,
            tokenDecimals
        );
    }
}
