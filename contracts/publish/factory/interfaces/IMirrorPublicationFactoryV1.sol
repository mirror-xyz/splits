//SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.7.0;

interface IMirrorPublicationFactoryV1 {
    function createPublication(address payable creator) external returns (address publication);
}