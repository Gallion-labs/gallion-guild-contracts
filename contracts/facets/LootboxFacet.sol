// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage, Modifiers} from "../libraries/LibAppStorage.sol";

contract LootboxFacet is Modifiers {

    event OpenLootboxEvent(address player, uint32 lootboxId);

    /// @notice Open a lootbox
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to query
    function openLootbox(address playerAddress, uint32 lootboxId) external {
        require(playerAddress != address(0), "Player address is not valid");
        require(s.players[playerAddress].createdAt > 0, "Player does not exist");
    }

}
