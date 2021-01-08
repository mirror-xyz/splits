pragma solidity ^0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./Mintable.sol";
import "./IENSManager.sol";
import "../publication/implementation/IMirrorPublicationV1.sol";

contract MirrorInviteToken is IMirrorPublicationV1, ERC20Burnable, Mintable {
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
    function register(string calldata label, address owner) external {
        _register(label, owner);
    }

    function _register(string memory label, address owner) private {
        _approve(msg.sender, _registrar, 1);
        IENSManager(_registrar).register(label, owner, msg.sender);
    }
}
