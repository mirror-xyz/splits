// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

import { OurStorage } from "./OurStorage.sol";

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    
    function transfer(address recipient, uint256 amount) external returns (bool);
}

interface IWETH {
    function deposit() external payable;

    function transfer(address to, uint256 value) external returns (bool);
}

/**
 * @title OurSplitter
 * @author Nick Adamson - nickadamson@pm.me
 * 
 * Building on the work from:
 * @author Mirror       @title Splits   https://github.com/mirror-xyz/splits
 * @author Gnosis       @title Safe     https://github.com/gnosis/safe-contracts
 * & of course, @author OpenZeppelin
 */
contract OurSplitter is OurStorage {
    uint256 public constant PERCENTAGE_SCALE = 10e5;

    /**======== Subgraph =========
     * ETHReceived - emits sender and value in receive() fallback
     * TransferETH - emits destination address, value, and success bool
     * MassTransferERC20 - emits token address, total transferred amount, and success bool 
     * WindowIncremented - emits token address, current claim window, and available value of ERC20
     */
    event ETHReceived(address indexed sender, uint256 value);
    event TransferETH(address account, uint256 amount, bool success);
    event MassTransferERC20(address token, uint256 amount, bool success);
    event WindowIncremented(uint256 currentWindow, uint256 fundsAvailable);

    // Plain ETH transfers
    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
        depositedInWindow += msg.value;
    }

    function claimETH(
        uint256 window,
        address account,
        uint256 scaledPercentageAllocation,
        bytes32[] calldata merkleProof
    ) external {
        require(currentWindow > window, "cannot claim for a future window");
        require(
            !isClaimed(window, account),
            "Account already claimed the given window"
        );

        setClaimed(window, account);

        require(
            verifyProof(
                merkleProof,
                merkleRoot,
                getNode(account, scaledPercentageAllocation)
            ),
            "Invalid proof"
        );

        transferETHOrWETH(
            account,
            // The absolute amount that's claimable.
            scaleAmountByPercentage(
                balanceForWindow[window],
                scaledPercentageAllocation
            )
        );
    }

    /**
     * NOTE: SPLITS DO NOT SUPPORT ERC20. THIS FUNCTION IS PROVIDED AS A LAST RESORT.
     * NOTE: AVOID ERC-20 AUCTION CURRENCIES AT ALL COST.
     *
     * @dev As a last resort option, this allows an Owner to attempt transferring the entire balance of an ERC20 to ALL split recipients.
     * @notice THE ONLY ADDRESS & ALLOCATION CHECKED ARE INDEX 0. THIS IS EASILY MANIPULATED.
     * @notice only callable by Owner, however doesn't protect against rogue owner.
     *
     * @custom:owners DONT BE SHITTY. OurActions live eternally on the block chain, Z is watching.
     */
    function massClaimERC20(
        address tokenAddress,
        address[] calldata accounts,
        uint256[] calldata allocations,
        bytes32[] calldata merkleProofZero // accounts[0], allocations[0]
    ) internal {
        require(
            verifyProof(
                merkleProofZero,
                merkleRoot,
                getNode(accounts[0], allocations[0])
            ),
            "Invalid proof"
        );

        uint256 ERC20Balance = IERC20(tokenAddress).balanceOf(address(this));

        for (uint256 i = 0; i <= accounts.length; i++) {
            transferERC20(
                tokenAddress, 
                accounts[i], 
                scaleAmountByPercentage(
                    ERC20Balance,
                    allocations[i]
                )
            );
        }

        emit MassTransferERC20(tokenAddress, ERC20Balance, true);
    }

    function claimETHForAllWindows(
        address account,
        uint256 percentageAllocation,
        bytes32[] calldata merkleProof
    ) external {
        // Make sure that the user has this allocation granted.
        require(
            verifyProof(merkleProof, merkleRoot, getNode(account, percentageAllocation)),
            "Invalid proof"
        );

        uint256 amount = 0;
        for (uint256 i = 0; i < currentWindow; i++) {
            if (!isClaimed(i, account)) {
                setClaimed(i, account);

                amount += scaleAmountByPercentage(balanceForWindow[i], percentageAllocation);
            }
        }

        transferETHOrWETH(account, amount);
    }

    function incrementWindow() public {
        uint256 fundsAvailable;

        if (currentWindow == 0) {
            fundsAvailable = address(this).balance;
        } else {
            // Current Balance, subtract previous balance to get the
            // funds that were added for this window.
            fundsAvailable = depositedInWindow;
        }

        depositedInWindow = 0;
        require(fundsAvailable > 0, "No additional funds for window");
        balanceForWindow.push(fundsAvailable);
        currentWindow += 1;
        emit WindowIncremented(currentWindow, fundsAvailable);
    }


    function scaleAmountByPercentage(uint256 amount, uint256 scaledPercent)
        public
        pure
        returns (uint256 scaledAmount)
    {
        /* Example:
                BalanceForWindow = 100 ETH // Allocation = 2%
                To find out the amount we use, for example: (100 * 200) / (100 * 100)
                which returns 2 -- i.e. 2% of the 100 ETH balance.
         */
        scaledAmount = (amount * scaledPercent) / (100 * PERCENTAGE_SCALE);
    }

    

    function isClaimed(uint256 window, address account)
        public
        view
        returns (bool)
    {
        return claimed[getClaimHash(window, account)];
    }

    //======== Private Functions ========
    function setClaimed(uint256 window, address account) private {
        claimed[getClaimHash(window, account)] = true;
    }


    function getClaimHash(uint256 window, address account)
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(window, account));
    }

    function amountFromPercent(uint256 amount, uint32 percent) private pure returns (uint256) {
        // Solidity 0.8.0 lets us do this without SafeMath.
        return (amount * percent) / 100;
    }

    function getNode(address account, uint256 percentageAllocation) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(account, percentageAllocation));
    }

    // Will attempt to transfer ETH, but will transfer WETH instead if it fails.
    function transferETHOrWETH(address to, uint256 value) private returns (bool didSucceed) {
        // Try to transfer ETH to the given recipient.
        didSucceed = attemptETHTransfer(to, value);
       if (!didSucceed) {
            // If the transfer fails, wrap and send as WETH, so that
            // the auction is not impeded and the recipient still
            // can claim ETH via the WETH contract (similar to escrow).
            IWETH(weth).deposit{value: value}();
            IWETH(weth).transfer(to, value);
            // At this point, the recipient can unwrap WETH.
        }

        emit TransferETH(to, value, didSucceed);
    }

    function attemptETHTransfer(address to, uint256 value) private returns (bool) {
        // Here increase the gas limit a reasonable amount above the default, and try
        // to send ETH to the recipient.
        // NOTE: This might allow the recipient to attempt  a limited reentrancy attack.
        (bool success, ) = to.call{ value: value, gas: 30000 }("");
        return success;
    }

    /**
     * @dev Transfers ERC20s
     * @notice Reverts entire transaction if one fails
     * @notice A rogue owner could easily bypass countermeasures. Provided as last resort,
     * in case Proxy receives ERC20.
     */
    function transferERC20(address tokenAddress, address splitRecipient, uint256 allocatedAmount) internal {
        bool didSucceed = IERC20(tokenAddress).transfer(splitRecipient, allocatedAmount);
        require(didSucceed);
    }

    // From https://github.com/protofire/zeppelin-solidity/blob/master/contracts/MerkleProof.sol
    function verifyProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) private pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];

            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
    }
}
