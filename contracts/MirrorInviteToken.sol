pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./Mintable.sol";
import "./IENSManager.sol";
import "./Authorizable.sol";

contract MirrorInviteToken is ERC20Burnable, Mintable, Authorizable {

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

  function _register(string memory label, address owner) private {
    _approve(msg.sender, _registrar, 1);
    IENSManager(_registrar).register(label, owner, msg.sender);
  }

  /**
   * @notice Helper to register subdomain without having to call approve. Calls register on the registrar contract.
   * @param label The subdomain to register
   * @param owner The owner to set
   */
  function register(string calldata label, address owner) external {
    _register(label, owner);
  }

  /**
   * @notice Meta transaction version of register.
   * @param owner The owner to register subdomain to
   * @param label The subdomain to register
   * @param validAfter The time after which signature is valid (unix)
   * @param validBefore The time before which signature is valid (unix)
   * @param nonce Unique nonce to prevent replays
   * @param v v of the signature
   * @param r r of the signature
   * @param s s of the signature
   */
  function registerWithAuthorization(address owner, string calldata label, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s) external {
    //_requireValidAuthorization()
    _register(label, owner);
    //_markAuthorizationAsUsed()
  }
}
