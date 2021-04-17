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
    uint256[] public balanceForWindow;
    mapping(bytes32 => bool) private claimed;
    uint256 private depositedInWindow;

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
    receive() external payable {
        depositedInWindow += msg.value;
    }
}
