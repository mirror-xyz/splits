//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

interface ISplitter {
    function validate() external view returns (bool isValid);

    function splitETH() external returns (bool success);

    function splitToken(address token) external returns (bool success);
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);
}

/**
 * @title Splitter
 * @author MirrorXYZ
 *
 *  A contract that can split eth and tokens to a given allocation based on percentages.
 */
contract Splitter is ISplitter {
    // An allocation comprises of an account and a percentage of the total
    // balance that that account should receive once the split is executed.
    uint32[] public percentages;
    address[] public accounts;
    // True if initialized.
    bool private _initialized;

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

    /**
     * Allows the instantiation of an array of allocations for splitting.
     *
     * NOTE: This does not validate the allocation on-chain, and therefore that
     * ought to be done before deploying the Splitter.
     *
     * Once the Splitter is deployed, `validate()` can be called for free
     * to confirm that make sure that the split is valid before funds are
     * transferred into the splitter.
     */
    function initialize(
        address[] calldata accounts_,
        uint32[] calldata percentages_
    ) external {
        // Basic validation that the Splitter hasn't been initialized.
        require(!_initialized, "Splitter already initialized");
        // Initialize storage.
        accounts = accounts_;
        percentages = percentages_;
    }

    function validate() external view override returns (bool isValid) {
        uint256 totalAllocation = 0;

        for (uint256 i = 0; i < accounts.length; i++) {
            totalAllocation += percentages[i];
        }

        return (totalAllocation == 100);
    }

    function splitETH() external override returns (bool success) {
        uint256 startingBalance = address(this).balance;

        // Expect success in all things; especially transfers via Splitter.
        success = true;
        for (uint256 i = 0; i < accounts.length; i++) {
            bool didSucceed =
                attemptETHTransfer(
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

    function splitToken(address token)
        external
        override
        returns (bool success)
    {
        uint256 startingBalance = IERC20(token).balanceOf(address(this));

        // Expect success in all things; especially transfers via Splitter.
        success = true;
        for (uint256 i = 0; i < accounts.length; i++) {
            bool didSucceed =
                attemptTokenTransfer(
                    token,
                    // To the allocation's account address.
                    accounts[i],
                    // For an amount equal to the allocation's percent of the starting balance.
                    amountFromPercent(startingBalance, percentages[i])
                );

            // If the operation did not succeed, we should return false from this function.
            if (!didSucceed) {
                success = false;
            }

            emit TransferToken(
                token,
                accounts[i],
                amountFromPercent(startingBalance, percentages[i]),
                percentages[i],
                didSucceed
            );
        }
    }

    function amountFromPercent(uint256 amount, uint32 percent)
        public
        pure
        returns (uint256)
    {
        // Solidity 0.8.0 lets us do this without SafeMath.
        return (amount * percent) / 100;
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
