pragma solidity ^0.6.8;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

import "./IENSResolver.sol";
import "./ENSReverseRegistrar.sol";
import "./IENSManager.sol";
import "./Owned.sol";
import "./ens/ENS.sol";
import "./strings.sol";

contract MirrorENSManager is IENSManager, Owned {

    using strings for *;

    // The managed root name
    string public rootName;
    // The managed root node
    bytes32 public rootNode;

    // Invite token to burn upon registration.
    address public mirrorInviteToken;

    ENS public ensRegistry;
    address public override ensResolver;


    // namehash('addr.reverse')
    bytes32 constant public ADDR_REVERSE_NODE = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

    event MirrorTokenBurned(address _address);

    // *************** Constructor ********************** //

    /**
     * @notice Constructor that sets the ENS root name and root node to manage.
     * @param _rootName The root name (e.g. argentx.eth).
     * @param _rootNode The node of the root name (e.g. namehash(argentx.eth)).
     * @param _ensRegistry The address of the ENS registry
     * @param _ensResolver The address of the ENS resolver
     */
    constructor(
        string memory _rootName,
        bytes32 _rootNode,
        address _ensRegistry,
        address _ensResolver,
        address _mirrorInviteToken
    ) public {
        rootName = _rootName;
        rootNode = _rootNode;
        ensRegistry = ENS(_ensRegistry);
        ensResolver = _ensResolver;

        // The mirror token is added for burning before registering.
        mirrorInviteToken = _mirrorInviteToken;
    }

    // *************** External Functions ********************* //

    /**
     * @notice This function must be called when the ENS Manager contract is replaced
     * and the address of the new Manager should be provided.
     * @param _newOwner The address of the new ENS manager that will manage the root node.
     */
    function changeRootnodeOwner(address _newOwner) external override onlyOwner {
        ensRegistry.setOwner(rootNode, _newOwner);
        emit RootnodeOwnerChange(rootNode, _newOwner);
    }

    /**
     * @notice Lets the owner change the address of the ENS resolver contract.
     * @param _ensResolver The address of the ENS resolver contract.
     */
    function changeENSResolver(address _ensResolver) external onlyOwner {
        require(_ensResolver != address(0), "MirrorENSRegistrar: address cannot be null");
        ensResolver = _ensResolver;
        emit ENSResolverChanged(_ensResolver);
    }

    function register(string calldata _label, address _owner, address _spender) external override {
      // Verify that the sender can burn a token.
      require(
        msg.sender == _spender || msg.sender == mirrorInviteToken,
        "MirrorENSRegistrar: caller must be user or token contract"
      );

      uint256 balancePriorToBurn = IERC20(mirrorInviteToken).balanceOf(_spender);
      require(
          balancePriorToBurn > 0, "Must have a token balance."
      );

      ERC20Burnable(mirrorInviteToken).burnFrom(_spender, 1);

      uint256 balanceAfterBurn = IERC20(mirrorInviteToken).balanceOf(_spender);

      require(balanceAfterBurn == balancePriorToBurn - 1, "MirrorENSManager: Failed to burn");
      emit MirrorTokenBurned(_spender);

      _register(_label, _owner);
    }

    /**
    * @notice Lets the manager assign an ENS subdomain of the root node to a target address.
    * Registers both the forward and reverse ENS.
    * @param _label The subdomain label.
    * @param _owner The owner of the subdomain.
    */
    function _register(string memory _label, address _owner) internal {
        bytes32 labelNode = keccak256(abi.encodePacked(_label));
        bytes32 node = keccak256(abi.encodePacked(rootNode, labelNode));
        address currentOwner = ensRegistry.owner(node);
        require(currentOwner == address(0), "MirrorENSManager: _label is alrealdy owned");

        // Forward ENS
        ensRegistry.setSubnodeRecord(rootNode, labelNode, _owner, ensResolver, 0);
        IENSResolver(ensResolver).setAddr(node, _owner);

        // Reverse ENS
        strings.slice[] memory parts = new strings.slice[](2);
        parts[0] = _label.toSlice();
        parts[1] = rootName.toSlice();
        string memory name = ".".toSlice().join(parts);
        ENSReverseRegistrar reverseRegistrar = ENSReverseRegistrar(_getENSReverseRegistrar());
        bytes32 reverseNode = reverseRegistrar.node(_owner);
        IENSResolver(ensResolver).setName(reverseNode, name);

        emit Registered(_owner, name);
    }

    /**
    * @notice Gets the official ENS reverse registrar.
    * @return Address of the ENS reverse registrar.
    */
    function getENSReverseRegistrar() external override view returns (address) {
        return _getENSReverseRegistrar();
    }

    // *************** Public Functions ********************* //

    /**
     * @notice Returns true is a given subnode is available.
     * @param _subnode The target subnode.
     * @return true if the subnode is available.
     */
    function isAvailable(bytes32 _subnode) public override view returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(rootNode, _subnode));
        address currentOwner = ensRegistry.owner(node);
        if (currentOwner == address(0)) {
            return true;
        }
        return false;
    }

    function _getENSReverseRegistrar() internal view returns (address) {
        return ensRegistry.owner(ADDR_REVERSE_NODE);
    }
}
