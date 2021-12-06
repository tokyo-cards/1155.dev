// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC1155Tradable.sol";

/**
 * @title DivaItem
 * DivaItem - a contract for Creature Accessory semi-fungible tokens.
 */
contract DivaItem is ERC1155Tradable {
    function initialize(address _proxyRegistryAddress) public initializer {
        _init(
            "OpenSea Creature Accessory",
            "OSCA",
            "https://diva.cards/api/item/{id}",
            _proxyRegistryAddress
        );
    }

    function contractURI() public pure returns (string memory) {
        return "https://diva.cards/contract/1155";
    }
}
