//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.3;

interface ISplitter {}

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
    struct Allocation {
        // The recipient's Ethereum account.
        address account;
        // The percent of the total balance that this account should receive.
        uint32 percent;
    }

    // Splits are made across an array of allocations, described in the struct above.
    Allocation[] allocations;

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
     * transferred into the splitted.
     */
    constructor(Allocation[] memory allocations_) {
        allocations = allocations_;
    }

    function validate() external view returns (bool isValid) {
        uint256 totalAllocation = 0;

        for (uint256 i = 0; i < allocations.length; i++) {
            totalAllocation += allocations[i].percent;
        }

        return (totalAllocation == 100);
    }

    function splitETH() external returns (bool success) {
        uint256 startingBalance = address(this).balance;

        // Expect success in all things; especially transfers via Splitter.
        success = true;
        for (uint256 i = 0; i < allocations.length; i++) {
            bool didSucceed =
                attemptETHTransfer(
                    // To the allocation's account address.
                    allocations[i].account,
                    // For an amount equal to the allocation's percent of the starting balance.
                    amountFromPercent(startingBalance, allocations[i].percent)
                );

            // If the operation did not succeed, we should return false from this function.
            if (!didSucceed) {
                success = false;
            }

            emit TransferETH(
                allocations[i].account,
                amountFromPercent(startingBalance, allocations[i].percent),
                allocations[i].percent,
                didSucceed
            );
        }
    }

    function splitToken(address token) external returns (bool success) {
        uint256 startingBalance = IERC20(token).balanceOf(address(this));

        // Expect success in all things; especially transfers via Splitter.
        success = true;
        for (uint256 i = 0; i < allocations.length; i++) {
            bool didSucceed =
                attemptTokenTransfer(
                    token,
                    // To the allocation's account address.
                    allocations[i].account,
                    // For an amount equal to the allocation's percent of the starting balance.
                    amountFromPercent(startingBalance, allocations[i].percent)
                );

            // If the operation did not succeed, we should return false from this function.
            if (!didSucceed) {
                success = false;
            }

            emit TransferToken(
                token,
                allocations[i].account,
                amountFromPercent(startingBalance, allocations[i].percent),
                allocations[i].percent,
                didSucceed
            );
        }
    }

    function amountFromPercent(uint256 amount, uint32 percent) public pure returns(uint256) {
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
    ) internal returns(bool) {
        (bool success, bytes memory data) =
            token.call(
                abi.encodeWithSelector(IERC20.transfer.selector, to, value)
            );
        return success && (data.length == 0 || abi.decode(data, (bool)));
    }
}
