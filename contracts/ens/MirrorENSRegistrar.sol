//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.8;

import "./utils/strings.sol";

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IENS} from "./interfaces/IENS.sol";
import {IENSResolver} from "./interfaces/IENSResolver.sol";
import {IENSReverseRegistrar} from "./interfaces/IENSReverseRegistrar.sol";
import {IMirrorENSRegistrar} from "./interfaces/IMirrorENSRegistrar.sol";

contract MirrorENSRegistrar is IMirrorENSRegistrar, Ownable {
    using strings for *;

    // ============ Constants ============

    /**
     * namehash('addr.reverse')
     */
    bytes32 public constant ADDR_REVERSE_NODE =
        0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2;

    // ============ Immutable Storage ============

    /**
     * The name of the ENS root, e.g. "mirror.xyz".
     */
    string public rootName;
    /**
     * The node of the root name (e.g. namehash(mirror.xyz))
     */
    bytes32 public rootNode;
    /**
     * The address of the public ENS registry.
     * @dev Dependency-injectable for testing purposes.
     */
    address ensRegistry;

    // ============ Mutable Storage ============

    /**
     * The address of the MirrorENSResolver.
     */
    address public override ensResolver;
    /**
     * The address of the MirrorInviteToken.
     */
    address public inviteToken;

    // ============ Events ============

    event RootnodeOwnerChange(bytes32 indexed node, address indexed owner);
    event ENSResolverChanged(address addr);
    event InviteTokenChanged(address addr);
    event RegisteredENS(address indexed _owner, string _ens);
    event UnregisteredENS(string _ens);

    // ============ Modifiers ============

    /**
     * @dev Modifier to check whether the `msg.sender` is the MirrorInviteToken.
     * If it is, it will run the function. Otherwise, it will revert.
     */
    modifier onlyInviteToken() {
        require(
            msg.sender == inviteToken,
            "MirrorENSRegistrar: caller is not the invite token"
        );
        _;
    }

    // ============ Constructor ============

    /**
     * @notice Constructor that sets the ENS root name and root node to manage.
     * @param rootName_ The root name (e.g. mirror.xyz).
     * @param rootNode_ The node of the root name (e.g. namehash(mirror.xyz)).
     * @param ensRegistry_ The address of the ENS registry
     * @param ensResolver_ The address of the ENS resolver
     */
    constructor(
        string memory rootName_,
        bytes32 rootNode_,
        address ensRegistry_,
        address ensResolver_,
        address inviteToken_
    ) public {
        rootName = rootName_;
        rootNode = rootNode_;
        ensRegistry = ensRegistry_;
        ensResolver = ensResolver_;
        inviteToken = inviteToken_;
    }

    // ============ Registration ============

    /**
     * @notice Assigns an ENS subdomain of the root node to a target address.
     * Registers both the forward and reverse ENS. Can only be called by InviteToken.
     * @param label_ The subdomain label.
     * @param owner_ The owner of the subdomain.
     */
    function register(string memory label_, address owner_)
        external
        onlyInviteToken
    {
        bytes32 labelNode = keccak256(abi.encodePacked(_label));
        bytes32 node = keccak256(abi.encodePacked(rootNode, labelNode));
        // TODO: Can be optimized.
        address currentOwner = getENS().owner(node);

        require(
            currentOwner == address(0),
            "MirrorENSManager: _label is already owned"
        );

        // Forward ENS
        getENS().setSubnodeRecord(rootNode, labelNode, owner_, ensResolver, 0);
        IENSResolver(ensResolver).setAddr(node, owner_);

        // Reverse ENS
        strings.slice[] memory parts = new strings.slice[](2);
        parts[0] = label_.toSlice();
        parts[1] = rootName.toSlice();
        string memory name = ".".toSlice().join(parts);
        IENSReverseRegistrar reverseRegistrar =
            IENSReverseRegistrar(getENSReverseRegistrar());
        bytes32 reverseNode = reverseRegistrar.node(owner_);
        IENSResolver(ensResolver).setName(reverseNode, name);

        emit RegisteredENS(owner_, name);
    }

    // ============ Invite Token Management ============

    /**
     * @notice Lets the owner change the address of invite token.
     * @param inviteToken_ The address of the new invite token contract.
     */
    function changeInviteToken(address inviteToken_)
        external
        override
        onlyOwner
    {
        inviteToken = inviteToken_;

        emit InviteTokenChanged(inviteToken_);
    }

    // ============ ENS Management ============

    /**
     * @notice Lets the owner change the address of the ENS resolver contract.
     * @param ensResolver_ The address of the ENS resolver contract.
     */
    function changeENSResolver(address ensResolver_) external onlyOwner {
        require(
            ensResolver_ != address(0),
            "MirrorENSRegistrar: address cannot be null"
        );
        ensResolver = ensResolver_;
        emit ENSResolverChanged(ensResolver_);
    }

    /**
     * @notice This function must be called when the ENS Manager contract is replaced
     * and the address of the new Manager should be provided.
     * @param _newOwner The address of the new ENS manager that will manage the root node.
     */
    function changeRootnodeOwner(address _newOwner)
        external
        override
        onlyOwner
    {
        getENS().setOwner(rootNode, _newOwner);
        emit RootnodeOwnerChange(rootNode, _newOwner);
    }

    /**
     * @notice Returns true is a given subnode is available.
     * @param subnode_ The target subnode.
     * @return true if the subnode is available.
     */
    function isAvailable(bytes32 subnode_) public view override returns (bool) {
        bytes32 node = keccak256(abi.encodePacked(rootNode, _subnode));
        // TODO: Can be optimized.
        address currentOwner = getENS().owner(node);
        if (currentOwner == address(0)) {
            return true;
        }
        return false;
    }

    /**
     * @notice Gets the official ENS reverse registrar.
     * @return Address of the ENS reverse registrar.
     */
    function getENSReverseRegistrar() public view returns (address) {
        return getENS().owner(ADDR_REVERSE_NODE);
    }

    function getENS() public view returns (EnsRegistry) {
        return IENS(ensRegistry);
    }
}
