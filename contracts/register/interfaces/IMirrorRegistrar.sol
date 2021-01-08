//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

interface IMirrorRegistrar {
    event RootnodeOwnerChange(bytes32 indexed _rootnode, address indexed _newOwner);
    event ENSResolverChanged(address addr);
    event Registered(address indexed _owner, string _ens, address publication);
    event Unregistered(string _ens);

    /**
     * @notice This function must be called when the ENS Manager contract is replaced
     * and the address of the new Manager should be provided.
     * @param _newOwner The address of the new ENS manager that will manage the root node.
     */
    function changeRootnodeOwner(address _newOwner) external;

    /**
    * @notice Lets the manager assign an ENS subdomain of the root node to a target address.
    * Registers both the forward and reverse ENS.
    * @param _label The subdomain label.
    * @param _owner The owner of the subdomain.
    * @param _spender The spender funding the registration.
    */
    function register(string calldata _label, address payable _owner, address _spender) external;

    /**
     * @notice Returns true is a given subnode is available.
     * @param _subnode The target subnode.
     * @return true if the subnode is available.
     */
    function isAvailable(bytes32 _subnode) external view returns(bool);

    /**
    * @notice Gets the official ENS reverse registrar.
    * @return Address of the ENS reverse registrar.
    */
    function getENSReverseRegistrar() external view returns (address);

    /**
    * @notice Gets the ENS Resolver.
    * @return Address of the ENS resolver.
    */
    function ensResolver() external view returns (address);
}
