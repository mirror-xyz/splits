pragma solidity >=0.5.4;

/**
 * @notice ENS Reverse Registrar interface.
 */
interface ENSReverseRegistrar {
    function claim(address _owner) external returns (bytes32);
    function claimWithResolver(address _owner, address _resolver) external returns (bytes32);
    function setName(string calldata _name) external returns (bytes32);
    function node(address _addr) external pure returns (bytes32);
}
