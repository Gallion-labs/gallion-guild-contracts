// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {AppStorage, Modifiers, Player, Rarity} from "../libraries/LibAppStorage.sol";
import "../libraries/LibLootbox.sol";

contract PlayerFacet is Modifiers {
    event LevelUpEvent(address player, uint16 level);

    struct PlayerInfo {
        address id;
        uint createdAt;
        uint16 level;
        uint256[] balances;
    }

    /// @notice Query all details relating to a player
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to query
    /// @return _player The player's details
    function player(address playerAddress) public view playerExists(playerAddress) returns (PlayerInfo memory _player) {
        _player.id = playerAddress;
        _player.createdAt = s.players[playerAddress].createdAt;
        _player.level = s.players[playerAddress].level;
        _player.balances = new uint256[](s.rarities.length + 1);
        for (uint i = 0; i < s.rarities.length + 1; i++) {
            _player.balances[i] = s._balances[i][playerAddress];
        }
        return _player;
    }

    /// @notice Add a player
    /// @dev This function throws for queries about the zero address and already existing players.
    /// @param playerAddress Address of the player to add
    function addPlayer(address playerAddress) external onlyGuildAdmin playerNotExists(playerAddress) {
        s.players[playerAddress] = Player(block.timestamp, 0);
        s.nPlayers++;
    }

    /// @notice Level-up a player
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress Address of the player to level-up
    function levelUp(address playerAddress) external onlyGallion playerExists(playerAddress) {
        s.players[playerAddress].level++;
        LibLootbox.awardLevelUpLootbox(playerAddress);
    }

    /// @notice Remove a player
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress Address of the player to remove
    function removePlayer(address playerAddress) external onlyGuildAdmin playerExists(playerAddress) {
        delete s.players[playerAddress];
        s.nPlayers--;
    }
}
