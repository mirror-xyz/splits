pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "./Mintable.sol";
import "./IENSManager.sol";
import "./Authorizable.sol";
import "./EIP712.sol";

contract MirrorInviteToken is ERC20Burnable, Mintable, Authorizable {
  // keccak256("registerWithAuthorization(address owner,string calldata label,uint256 validAfter,uint256 validBefore,bytes32 nonce,uint8 v,bytes32 r,bytes32 s)")
  bytes32 public constant REGISTER_WITH_AUTHORIZATION_TYPEHASH = 0x16f5869e9cdee17c2a5067be9530bee3de761fa7194831e47c6bfa6405bab752;

  address private _registrar;

  constructor(string memory name, string memory symbol) Mintable(name, symbol) public {
    _setupDecimals(0);
    DOMAIN_SEPARATOR = EIP712.makeDomainSeparator(name, "1");
  }

  // ***** VIEW *****

  function registrar() external view returns (address) {
    return _registrar;
  }

  // ***** MUTATING FUNCTIONS *****

  /**
   * @dev Sets the registrar that the token interacts with for register
   * @param registrar_ New registrar
   */
  function setRegistrar(address registrar_) onlyOwner external {
    _registrar = registrar_;
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
    _requireValidAuthorization(owner, nonce, validAfter, validBefore);
    // TODO: maybe use hash of label instead
    bytes memory data = abi.encode(
      REGISTER_WITH_AUTHORIZATION_TYPEHASH,
      owner,
      label,
      validAfter,
      validBefore,
      nonce
    );
    require(
      EIP712.recover(DOMAIN_SEPARATOR, v, r, s, data) == owner,
      "MirrorInviteToken: invalid signature"
    );
    //_markAuthorizationAsUsed()

    _register(label, owner);
  }
}
