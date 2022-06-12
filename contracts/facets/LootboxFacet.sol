// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/LibAppStorage.sol";

contract LootboxFacet {
    AppStorage internal s;
    event OpenLootboxEvent(address player, uint32 lootboxId);

    function openLootbox(address player, uint32 lootboxId) external {
        require(player != address(0), "Player address is not valid");
        require(s.playersExists[player], "Player does not exist");
    }

}
