// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.13;

import {AppStorage, Modifiers, Rarity} from "../libraries/LibAppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibLootbox.sol";
import "../libraries/LibTokens.sol";

contract LootboxFacet is Modifiers {
    /// @notice Query all lootboxes owned by a player
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to query for lootboxes
    /// @return _lootboxBalances The lootboxes owned by the player
    function list(address playerAddress) public view playerExists(playerAddress) returns (uint256[] memory _lootboxBalances) {
        _lootboxBalances = LibLootbox.list(playerAddress);
    }

    /// @notice Award a lootbox
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to award the lootbox to
    /// @param lootboxTokenId The lootbox token id  to award (1-5)
    function award(address playerAddress, uint256 lootboxTokenId) public playerExists(playerAddress) onlyGallion returns (bool) {
        LibTokens.mint(playerAddress, lootboxTokenId, 1, "0x0");
        return true;
    }

    /// @notice Open a lootbox
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to query
    /// @param lootboxTokenId The lootbox to open
    function open(address playerAddress, uint256 lootboxTokenId) external noReentrant playerExists(playerAddress) onlyGallion returns (bool) {
        require(s._balances[lootboxTokenId][playerAddress] >= 1, "Player does not own a lootbox of this rarity");
        return LibLootbox.open(playerAddress, lootboxTokenId);
    }
}
