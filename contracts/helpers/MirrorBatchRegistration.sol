//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.8;
pragma experimental ABIEncoderV2;

import {IMirrorWriteToken} from "../interfaces/IMirrorWriteToken.sol";
import {SafeMath} from "../lib/SafeMath.sol";

/**
 * @title MirrorBatchRegistration
 * @author MirrorXYZ
 *
 *  A helper contract for registering a batch of users.
 */
contract MirrorBatchRegistration {
    using SafeMath for uint256;

    IMirrorWriteToken token;

    constructor(address token_) public {
        token = IMirrorWriteToken(token_);
    }

    /**
     * Given an array of labels and owners, we register each label to each owner
     * via 1:1 mapping through index.
     *
     * Preconditions:
     *   - labels and owners arrays should correspond exactly.
     *   - sender needs to grant token allowance to this contract.
     * Postconditions: MirrorWriteToken will burn the same number of tokens
     *   as there are labels to register.
     *
     * @param labels The list of ENS labels to register.
     * @param owners The list of addresses that should own the labels.
     */
    function registerBatch(string[] calldata labels, address[] calldata owners)
        external
    {
        uint256 len = labels.length;
        uint256 requiredTokens = token.registrationCost().mul(len);

        require(
            token.allowance(msg.sender, address(this)) >= requiredTokens,
            "MirrorBatchRegistration: need to grant token allowance"
        );

        // Pull the required number of tokens from the sender.
        token.transferFrom(msg.sender, address(this), requiredTokens);

        for (uint256 i = 0; i < len; i++) {
            token.register(labels[i], owners[i]);
        }
    }
}
