//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

/**
 * @title SplitterProxy
 * @author MirrorXYZ
 *
 *  A contract that can split eth and tokens to a given allocation based on percentages.
 */
contract SplitterProxyV2 {
    // Inherited Storage.
    address internal _splitter;
    bytes32 public merkleRoot;
    address public wethAddress;
    bool public initialized;
    uint256 public currentWindow;
    uint256[] balanceForWindow;
    mapping(bytes32 => bool) private claimed;

    constructor(address splitter_, address wethAddress_) {
        _splitter = splitter_;
        wethAddress = wethAddress_;
    }

    function initialize(bytes32 merkleRoot_) public {
        require(!initialized, "Proxy already initialized");
        initialized = true;
        merkleRoot = merkleRoot_;
    }

    fallback() external payable {
        require(initialized, "Proxy not initialized");
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
