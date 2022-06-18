// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {AppStorage, Modifiers, Player} from "../libraries/LibAppStorage.sol";

contract PlayerFacet is Modifiers {
    event LevelUpEvent(address player, uint16 level);

    /// @notice Query all details relating to a player
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to query
    /// @return _player The player's details
    function player(address playerAddress) public view returns (Player memory _player) {
        require(playerAddress != address(0), "Player address is not valid");
        require(s.players[playerAddress].createdAt > 0, "Player does not exist");
        _player = s.players[playerAddress];
    }

    /// @notice Add a player
    /// @dev This function throws for queries about the zero address and already existing players.
    /// @param playerAddress Address of the player to add
    function addPlayer(address playerAddress) external onlyGuildAdmin {
        require(playerAddress != address(0), "PlayerFacet: Player address is not valid");
        require(!(s.players[playerAddress].createdAt > 0), "PlayerFacet: Player already exists");
        s.players[playerAddress] = Player(block.timestamp, 0);
    }

    /// @notice Level-up a player
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress Address of the player to level-up
    function levelUp(address playerAddress) external onlyGallion playerExists(playerAddress) {
        require(playerAddress != address(0), "PlayerFacet: Player address is not valid");
        s.players[playerAddress].level++;
    }

    /// @notice Remove a player
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress Address of the player to remove
    function removePlayer(address playerAddress) external onlyGuildAdmin {
        require(playerAddress != address(0), "PlayerFacet: Player address is not valid");
        require(s.players[playerAddress].createdAt > 0, "PlayerFacet: Player does not exist");
        delete s.players[playerAddress];
    }
}
