contract Authorizable {
  enum AuthorizationState { Unused, Used, Canceled }

  /**
   * @dev authorizer address => nonce => authorization state
   */
  mapping(address => mapping(bytes32 => AuthorizationState)) private _authorizationStates;

  event AuthorizationUsed(address indexed authorizer, bytes32 indexed nonce);
  event AuthorizationCanceled(address indexed authorizer, bytes32 indexed nonce);

  /**
   * @notice Returns the state of an authorization
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   * @return Authorization state
   */
  function authorizationState(address authorizer, bytes32 nonce) external view returns (AuthorizationState) {
    return _authorizationStates[authorizer][nonce];
  }

  /**
   * @notice Check that an authorization is unused
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   */
  function _requireUnusedAuthorization(address authorizer, bytes32 nonce) internal view {
    require( _authorizationStates[authorizer][nonce] == AuthorizationState.Unused, "Authorizable: authorization is used or canceled");
  }

  /**
   * @notice Check that authorization is valid
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   * @param validAfter    The time after which this is valid (unix time)
   * @param validBefore   The time before which this is valid (unix time)
   */
  function _requireValidAuthorization(address authorizer, bytes32 nonce, uint256 validAfter, uint256 validBefore) internal view {
    require(now > validAfter, "Authorizable: authorization is not yet valid");
    require(now < validBefore, "Authorizable: authorization is expired");
    _requireUnusedAuthorization(authorizer, nonce);
  }

  /**
   * @notice Mark an authorization as used
   * @param authorizer    Authorizer's address
   * @param nonce         Nonce of the authorization
   */
  function _markAuthorizationAsUsed(address authorizer, bytes32 nonce) internal {
    _authorizationStates[authorizer][nonce] = AuthorizationState.Used;
    emit AuthorizationUsed(authorizer, nonce);
  }
}
