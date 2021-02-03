//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.6.8;

import {IENSReverseRegistrar} from "./IENSReverseRegistrar.sol";

interface IMirrorENSRegistrar {
    function changeRootNodeOwner(address newOwner_) external;

    function register(string calldata label_, address owner_) external;

    function updateENSReverseRegistrar() external;
}
