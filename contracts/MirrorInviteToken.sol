pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./Mintable.sol";
import "./IENSManager.sol";

contract MirrorInviteToken is ERC20Burnable, Mintable {

  address private _registrar;

  constructor(string memory name, string memory symbol) Mintable(name, symbol) public {
    _setupDecimals(0);
  }

  // ***** VIEW *****

  function registrar() external view returns (address) {
    return _registrar;
  }

  // ***** MUTATING FUNCTIONS *****

  /**
   * @dev Sets the registrar that the token interacts with for register
   * @param registrar New registrar
   */
  function setRegistrar(address registrar) onlyOwner external {
    _registrar = registrar;
  }

  /**
   * @notice Helper to register subdomain without having to call approve. Calls register on the registrar contract.
   * @param label The subdomain to register
   * @param owner The owner to set
   */
  function register(string calldata label, address owner) external {
    _approve(msg.sender, _registrar, 1);
    IENSManager(_registrar).register(label, owner);
  }
}
