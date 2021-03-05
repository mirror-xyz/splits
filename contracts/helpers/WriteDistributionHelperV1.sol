//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

import {
    MerkleProof
} from "@openzeppelin/contracts/cryptography/MerkleProof.sol";
import {IMirrorWriteToken} from "../interfaces/IMirrorWriteToken.sol";
import {SafeMath} from "../lib/SafeMath.sol";

/**
 * @title WriteDistributionHelperV1
 * @author MirrorXYZ
 *
 * A helper contract for distributing $WRITE token.
 */
contract WriteDistributionHelperV1 {
    using SafeMath for uint256;

    // ============ Constants ============

    uint64 constant units = 1e18;

    // ============ Immutable Storage ============

    address public immutable token;

    // ============ Mutable Storage ============

    address private _owner;
    /**
     * @dev Allows for two-step ownership transfer, whereby the next owner
     * needs to accept the ownership transfer explicitly.
     */
    address private _nextOwner;
    bytes32 public merkleRoot;
    mapping(uint256 => uint256) private claimedBitMap;

    // ============ Events ============

    event Distributed(address account);
    event RootUpdated(bytes32 oldRoot, bytes32 newRoot);
    event Claimed(bytes32 index, address account, uint256 amount);
    event Transfer(address indexed from, address indexed to, uint256 value);
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    // ============ Modifiers ============

    modifier onlyOwner() {
        require(isOwner(), "MirrorWriteToken: caller is not the owner.");
        _;
    }

    modifier onlyNextOwner() {
        require(
            isNextOwner(),
            "MirrorWriteToken: current owner must set caller as next owner."
        );
        _;
    }

    // ============ Constructor ============

    constructor(address token_) public {
        token = token_;

        _owner = tx.origin;
        emit OwnershipTransferred(address(0), _owner);
    }

    // ============ Ownership ============

    /**
     * @dev Returns true if the caller is the current owner.
     */
    function isOwner() public view returns (bool) {
        return msg.sender == _owner;
    }

    /**
     * @dev Returns true if the caller is the next owner.
     */
    function isNextOwner() public view returns (bool) {
        return msg.sender == _nextOwner;
    }

    /**
     * @dev Allows a new account (`newOwner`) to accept ownership.
     * Can only be called by the current owner.
     */
    function transferOwnership(address nextOwner_) external onlyOwner {
        require(
            nextOwner_ != address(0),
            "MirrorWriteToken: next owner is the zero address."
        );

        _nextOwner = nextOwner_;
    }

    /**
     * @dev Cancel a transfer of ownership to a new account.
     * Can only be called by the current owner.
     */
    function cancelOwnershipTransfer() external onlyOwner {
        delete _nextOwner;
    }

    /**
     * @dev Transfers ownership of the contract to the caller.
     * Can only be called by a new potential owner set by the current owner.
     */
    function acceptOwnership() external onlyNextOwner {
        delete _nextOwner;

        emit OwnershipTransferred(_owner, msg.sender);

        _owner = msg.sender;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() external onlyOwner {
        emit OwnershipTransferred(_owner, address(0));
        _owner = address(0);
    }

    // ============ Distribution ============

    function distributeTo(address[] memory addresses) public returns (bool ok) {
        IMirrorWriteToken tokenContract = IMirrorWriteToken(token);

        for (uint256 i = 0; i < addresses.length; i++) {
            tokenContract.transfer(addresses[i], units);
            emit Distributed(addresses[i]);
        }

        return true;
    }

    // ============ Merkle-Tree Token Claim ============

    function setMerkleRoot(bytes32 merkleRoot_) external onlyOwner {
        emit RootUpdated(merkleRoot, merkleRoot_);
        merkleRoot = merkleRoot_;
    }

    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] =
            claimedBitMap[claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(!isClaimed(index), "WriteDistributionV1: already claimed.");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProof.verify(merkleProof, merkleRoot, node),
            "WriteDistributionV1: Invalid proof."
        );

        // Mark it claimed and send the token.
        _setClaimed(index);
        require(
            IMirrorWriteToken(token).transfer(account, amount),
            "WriteDistributionV1: Transfer failed."
        );

        emit Claimed(index, account, amount);
    }
}
