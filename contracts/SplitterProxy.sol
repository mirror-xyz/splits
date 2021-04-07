//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

/**
 * @title SplitterProxy
 * @author MirrorXYZ
 *
 *  A contract that can split eth and tokens to a given allocation based on percentages.
 */
contract SplitterProxy {
    // Inherited Storage.
    address internal _splitter;
    bytes32 public allocationHash;
    address public wethAddress;
    bool public initialized;

    constructor(address splitter_, address wethAddress_) {
        _splitter = splitter_;
        wethAddress = wethAddress_;
    }

    function initialize(bytes32 allocationHash_) public {
        require(!initialized, "Proxy already initialized");
        initialized = true;
        allocationHash = allocationHash_;
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

    // Funtion calls with data are delegated to the splitter.
    // fallback() external payable {
    //     _delegate(splitter);
    // }

    // Plain ETH transfers.
    receive() external payable {}

    function splitter() public view returns (address) {
        return _splitter;
    }

    // function _delegate(address implementation) private {
    //     assembly {
    //         // Copy msg.data. We take full control of memory in this inline assembly
    //         // block because it will not return to Solidity code. We overwrite the
    //         // Solidity scratch pad at memory position 0.
    //         calldatacopy(0, 0, calldatasize())

    //         // Delegatecall to the implementation, supplying calldata and gas.
    //         // Out and outsize are set to zero - instead, use the return buffer.
    //         let result := delegatecall(
    //             gas(),
    //             implementation,
    //             0,
    //             calldatasize(),
    //             0,
    //             0
    //         )

    //         // Copy the returned data from the return buffer.
    //         returndatacopy(0, 0, returndatasize())

    //         switch result
    //             // Delegatecall returns 0 on error.
    //             case 0 {
    //                 revert(0, returndatasize())
    //             }
    //             default {
    //                 return(0, returndatasize())
    //             }
    //     }
}
