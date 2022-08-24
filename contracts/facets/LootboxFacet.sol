// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.13;

import {AppStorage, Rarity, LootboxContent} from "../libraries/LibAppStorage.sol";
import {Modifiers} from "../libraries/Modifiers.sol";
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
    /// @param amount The amount of lootboxes to award
    function award(address playerAddress, uint256 lootboxTokenId, uint256 amount) public playerExists(playerAddress) onlyGallion {
        LibLootbox.mint(playerAddress, lootboxTokenId, amount);
    }

    /// @notice Open a lootbox
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to query
    /// @param lootboxTokenId The lootbox to open
    function open(address playerAddress, uint256 lootboxTokenId) external noReentrant playerExists(playerAddress) onlyGallion returns (LootboxContent memory) {
        require(s._balances[lootboxTokenId][playerAddress] >= 1, "Player does not own a lootbox of this rarity");
        return LibLootbox.open(playerAddress, lootboxTokenId);
    }

    function getTotalMintedLoootboxes() public view returns (uint256) {
        return s.totalMintedLoootboxes;
    }

    function getTotalOpenedLoootboxes() public view returns (uint256) {
        return s.totalOpenedLoootboxes;
    }
}
