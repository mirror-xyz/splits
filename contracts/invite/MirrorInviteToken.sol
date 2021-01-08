//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

// Open-Zeppelin contracts
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
// Mintable
import "./lib/Mintable.sol";
// Registration
import "../register/interfaces/IMirrorRegistrar.sol";

contract MirrorInviteToken is ERC20Burnable, Mintable {

    address private _registrar;

    constructor(string memory name, string memory symbol) Mintable(name, symbol) public {
        _setupDecimals(0);
    }

    function registrar() external view returns (address) {
        return _registrar;
    }

    /**
     * @dev Sets the registrar that the token interacts with for register
     * @param registrar_ New registrar
     */
    function setRegistrar(address registrar_) onlyOwner external {
        _registrar = registrar_;
    }

    /**
     * @notice Helper to register subdomain without having to call approve. Calls register on the registrar contract.
     * @param label The subdomain to register
     * @param owner The owner to set
     */
    function register(string calldata label, address payable owner) external {
        _register(label, owner);
    }

    function _register(string memory label, address payable owner) private {
        _approve(msg.sender, _registrar, 1);
        IMirrorRegistrar(_registrar).register(label, owner, msg.sender);
    }
}
