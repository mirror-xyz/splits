// Sources flattened with hardhat v2.0.7 https://hardhat.org

// File contracts/SplitProxy.sol

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

interface ISplitFactory {
    function splitter() external returns (address);

    function wethAddress() external returns (address);

    function merkleRoot() external returns (bytes32);
}

/**
 * @title SplitProxy
 * @author MirrorXYZ
 */
contract SplitProxy {
    // Inherited Storage.
    bytes32 public merkleRoot;
    uint256 public currentWindow;
    address private wethAddress;
    address private _splitter;
    uint256[] private balanceForWindow;
    mapping(bytes32 => bool) private claimed;

    constructor() {
        _splitter = ISplitFactory(msg.sender).splitter();
        wethAddress = ISplitFactory(msg.sender).wethAddress();
        merkleRoot = ISplitFactory(msg.sender).merkleRoot();
    }

    fallback() external payable {
        address _impl = splitter();
        assembly {
            let ptr := mload(0x40)
            calldatacopy(ptr, 0, calldatasize())
            let result := delegatecall(gas(), _impl, ptr, calldatasize(), 0, 0)
            let size := returndatasize()
            returndatacopy(ptr, 0, size)

            switch result
                case 0 {
                    revert(ptr, size)
                }
                default {
                    return(ptr, size)
                }
        }
    }

    function splitter() public view returns (address) {
        return _splitter;
    }

    // Plain ETH transfers.
    receive() external payable {}
}


// File contracts/SplitFactory.sol

// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

/**
 * @title SplitFactory
 * @author MirrorXYZ
 */
contract SplitFactory {
    //======== Immutable storage =========

    address public immutable splitter;
    address public immutable wethAddress;

    //======== Mutable storage =========

    // Gets set within the block, and then deleted.
    bytes32 public merkleRoot;

    //======== Constructor =========

    constructor(address splitter_, address wethAddress_) {
        splitter = splitter_;
        wethAddress = wethAddress_;
    }

    //======== Deploy function =========

    function createSplit(bytes32 merkleRoot_)
        external
        returns (address splitProxy)
    {
        merkleRoot = merkleRoot_;
        splitProxy = address(
            new SplitProxy{salt: keccak256(abi.encode(merkleRoot_))}()
        );
        delete merkleRoot;
    }
}
