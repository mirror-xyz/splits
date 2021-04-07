//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

interface ISplitter {
    // function validate() external view returns (bool isValid);
    // function splitETH() external returns (bool success);
    // function splitToken(address token) external returns (bool success);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);
}

interface IWETH {
    function deposit() external payable;

    function transfer(address to, uint256 value) external returns (bool);
}

/**
 * @title Splitter
 * @author MirrorXYZ
 *
 *  A contract that can split eth and tokens to a given allocation based on percentages.
 */
contract SplitterV3 is ISplitter {
    // Inherited Storage.
    address public splitter;
    bytes32 public allocationHash;
    address public wethAddress;
    bool private initialized;

    // The TransferETH event is emitted after each eth transfer in the split is attempted.
    event TransferETH(
        // The account to which the transfer was attempted.
        address account,
        // The amount for transfer that was attempted.
        uint256 amount,
        // The percent of the total balance that this amount represented.
        uint32 percent,
        // Whether or not the transfer succeeded.
        bool success
    );

    // The TransferToken event is emitted after each ERC20 transfer in the split is attempted.
    event TransferToken(
        // The address of the ERC20 token to which the transfer was attempted.
        address token,
        // The account to which the transfer was attempted.
        address account,
        // The amount for transfer that was attempted.
        uint256 amount,
        // The percent of the total balance that this amount represented.
        uint32 percent,
        // Whether or not the transfer succeeded.
        bool success
    );

    function validateAllocation(
        address[] calldata accounts,
        uint32[] calldata percentages
    ) public view returns (bool) {
        return allocationHash == encodeAllocation(accounts, percentages);
    }

    function encodeAllocation(
        address[] calldata accounts,
        uint32[] calldata percentages
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(percentages, accounts));
    }

    function executeETHSplit(
        address[] calldata accounts,
        uint32[] calldata percentages
    ) external returns (bool success) {
        require(
            validateAllocation(accounts, percentages),
            "Allocation is invalid"
        );
        uint256 startingBalance = address(this).balance;

        // Expect success in all things; especially transfers via Splitter.
        success = true;
        for (uint256 i = 0; i < accounts.length; i++) {
            bool didSucceed =
                transferETHOrWETH(
                    // To the allocation's account address.
                    accounts[i],
                    // For an amount equal to the allocation's percent of the starting balance.
                    amountFromPercent(startingBalance, percentages[i])
                );

            // If the operation did not succeed, we should return false from this function.
            if (!didSucceed) {
                success = false;
            }

            emit TransferETH(
                accounts[i],
                amountFromPercent(startingBalance, percentages[i]),
                percentages[i],
                didSucceed
            );
        }
    }

    // function splitToken(address token)
    //     external
    //     override
    //     returns (bool success)
    // {
    //     uint256 startingBalance = IERC20(token).balanceOf(address(this));

    //     // Expect success in all things; especially transfers via Splitter.
    //     success = true;
    //     for (uint256 i = 0; i < accounts.length; i++) {
    //         bool didSucceed =
    //             attemptTokenTransfer(
    //                 token,
    //                 // To the allocation's account address.
    //                 accounts[i],
    //                 // For an amount equal to the allocation's percent of the starting balance.
    //                 amountFromPercent(startingBalance, percentages[i])
    //             );

    //         // If the operation did not succeed, we should return false from this function.
    //         if (!didSucceed) {
    //             success = false;
    //         }

    //         emit TransferToken(
    //             token,
    //             accounts[i],
    //             amountFromPercent(startingBalance, percentages[i]),
    //             percentages[i],
    //             didSucceed
    //         );
    //     }
    // }

    function amountFromPercent(uint256 amount, uint32 percent)
        public
        pure
        returns (uint256)
    {
        // Solidity 0.8.0 lets us do this without SafeMath.
        return (amount * percent) / 100;
    }

    // Will attempt to transfer ETH, but will transfer WETH instead if it fails.
    function transferETHOrWETH(address to, uint256 value)
        private
        returns (bool didSucceed)
    {
        // Try to transfer ETH to the given recipient.
        didSucceed = attemptETHTransfer(to, value);
        if (!didSucceed) {
            // If the transfer fails, wrap and send as WETH, so that
            // the auction is not impeded and the recipient still
            // can claim ETH via the WETH contract (similar to escrow).
            IWETH(wethAddress).deposit{value: value}();
            IWETH(wethAddress).transfer(to, value);
            // At this point, the recipient can unwrap WETH.
        }
    }

    function attemptETHTransfer(address to, uint256 value)
        private
        returns (bool)
    {
        // Here increase the gas limit a reasonable amount above the default, and try
        // to send ETH to the recipient.
        // NOTE: This might allow the recipient to attempt a limited reentrancy attack.
        (bool success, ) = to.call{value: value, gas: 30000}("");
        return success;
    }

    function attemptTokenTransfer(
        address token,
        address to,
        uint256 value
    ) private returns (bool) {
        (bool success, bytes memory data) =
            token.call(
                abi.encodeWithSelector(IERC20.transfer.selector, to, value)
            );
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }

    receive() external payable {
        // This is expected.
    }
}
