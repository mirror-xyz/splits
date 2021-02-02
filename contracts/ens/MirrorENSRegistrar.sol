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
     * @dev dependency injectable for testnet.
     */
    string public rootName;

    /**
     * The node of the root name (e.g. namehash(mirror.xyz))
     */
    bytes32 public immutable rootNode;

    /**
     * The address of the public ENS registry.
     * @dev Dependency-injectable for testing purposes, but otherwise this is the
     * canonical ENS registry at 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e.
     */
    IENS public immutable ensRegistry;

    /**
     * The address of the MirrorInviteToken that gates access to this namespace.
     */
    address public immutable inviteToken;

    /**
     * The address of the MirrorENSResolver.
     */
    IENSResolver public immutable ensResolver;

    // ============ Mutable Storage ============

    /**
     * Set by anyone to the correct address after configuration,
     * to prevent a lookup on each registration.
     */
    IENSReverseRegistrar public reverseRegistrar;

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

        inviteToken = inviteToken_;

        // Registrations are cheaper if these are instantiated.
        ensRegistry = IENS(ensRegistry_);
        ensResolver = IENSResolver(ensResolver_);
    }

    // ============ Registration ============

    /**
     * @notice Assigns an ENS subdomain of the root node to a target address.
     * Registers both the forward and reverse ENS. Can only be called by InviteToken.
     * @param label_ The subdomain label.
     * @param owner_ The owner of the subdomain.
     */
    function register(string calldata label_, address owner_)
        external
        override
        onlyInviteToken
    {
        bytes32 labelNode = keccak256(abi.encodePacked(label_));
        bytes32 node = keccak256(abi.encodePacked(rootNode, labelNode));

        require(
            ensRegistry.owner(node) == address(0),
            "MirrorENSManager: label is already owned"
        );

        // Forward ENS
        ensRegistry.setSubnodeRecord(
            rootNode,
            labelNode,
            owner_,
            address(ensResolver),
            0
        );
        ensResolver.setAddr(node, owner_);

        // Reverse ENS
        strings.slice[] memory parts = new strings.slice[](2);
        parts[0] = label_.toSlice();
        parts[1] = rootName.toSlice();
        string memory name = ".".toSlice().join(parts);
        bytes32 reverseNode = reverseRegistrar.node(owner_);
        ensResolver.setName(reverseNode, name);

        emit RegisteredENS(owner_, name);
    }

    // ============ ENS Management ============

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
        ensRegistry.setOwner(rootNode, _newOwner);
        emit RootnodeOwnerChange(rootNode, _newOwner);
    }

    /**
     * @notice Updates to the reverse registrar.
     */
    function updateENSReverseRegistrar() external override onlyOwner {
        reverseRegistrar = IENSReverseRegistrar(
            ensRegistry.owner(ADDR_REVERSE_NODE)
        );
    }
}
