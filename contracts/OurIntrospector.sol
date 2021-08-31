// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.4;

contract OurIntrospector {
    //======== ERC721 =========
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.3.0/contracts/token/ERC721/IERC721Receiver.sol
    event TokenReceived(address operator, address from, uint256 tokenId);

    function onERC721Received(
        address operator_,
        address from_,
        uint256 tokenId_,
        bytes calldata
    ) external returns (bytes4) {
        emit TokenReceived(operator_, from_, tokenId_);
        return 0x150b7a02;
    }

    //======== IERC1155 =========
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.3.0/contracts/token/ERC1155/IERC1155Receiver.sol
    event ERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value
    );
    event Batch1155Received(
        address operator,
        address from,
        uint256[] ids,
        uint256[] values
    );

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata
    ) external pure override returns (bytes4) {
        emit ERC1155Received(operator, from, id, value);
        return 0xf23a6e61;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata
    ) external pure override returns (bytes4) {
        emit Batch1155Received(operator, from, ids, values);
        return 0xbc197c81;
    }

    //======== IERC777 =========
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.3.0/contracts/token/ERC777/IERC777Recipient.sol
    event ERC777Received(
        address operator,
        address from,
        address to,
        uint256 amount
    );

    function tokensReceived(
        address operator,
        address from,
        address to,
        uint256 amount,
        bytes calldata,
        bytes calldata
    ) external {
        emit ERC777Received(operator, from, to, amount);
    }

    //======== IERC165 =========
    // https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.3.0/contracts/utils/introspection/ERC165.sol
    function supportsInterface(bytes4 interfaceId)
        external
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(ERC1155TokenReceiver).interfaceId ||
            interfaceId == type(ERC721TokenReceiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
