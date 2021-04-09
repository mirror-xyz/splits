// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

interface ISplitterProxyV2Factory {
    function splitter() external returns (address);

    function wethAddress() external returns (address);

    function merkleRoot() external returns (bytes32);
}

/**
 * @title SplitterProxyV2
 * @author MirrorXYZ
 */
contract SplitterProxyV2 {
    // Inherited Storage.
    address internal _splitter;
    bytes32 public merkleRoot;
    address public wethAddress;
    uint256 public currentWindow;
    uint256[] balanceForWindow;
    mapping(bytes32 => bool) private claimed;

    constructor() {
        _splitter = ISplitterProxyV2Factory(msg.sender).splitter();
        wethAddress = ISplitterProxyV2Factory(msg.sender).wethAddress();
        merkleRoot = ISplitterProxyV2Factory(msg.sender).merkleRoot();
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
