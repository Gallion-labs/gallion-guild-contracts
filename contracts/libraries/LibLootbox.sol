// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {AppStorage, Player, Rarity, LootboxContent} from "./LibAppStorage.sol";
import {LibDiamond} from "./LibDiamond.sol";
import {LibTokens} from "./LibTokens.sol";
import {LibUtils} from "./Utils.sol";

library LibLootbox {
    /**
     * @dev Emitted when a lootbox is opened.
     */
    event OpenLootboxEvent(address player, uint256 lootboxTokenId);

    function list(address playerAddress) internal view returns (uint256[] memory _lootboxBalances) {
        AppStorage storage s = LibDiamond.appStorage();

        uint256[] memory lootboxIds = new uint256[](5);
        lootboxIds[0] = s.lootboxIds[Rarity.level1];
        lootboxIds[1] = s.lootboxIds[Rarity.level2];
        lootboxIds[2] = s.lootboxIds[Rarity.level3];
        lootboxIds[3] = s.lootboxIds[Rarity.level4];
        lootboxIds[4] = s.lootboxIds[Rarity.level5];

        address[] memory playerAddresses = new address[](5);
        playerAddresses[0] = playerAddress;
        playerAddresses[1] = playerAddress;
        playerAddresses[2] = playerAddress;
        playerAddresses[3] = playerAddress;
        playerAddresses[4] = playerAddress;

        _lootboxBalances = LibTokens.balanceOfBatch(playerAddresses, lootboxIds);
    }

    /// @notice Award a lootbox for a player who has leveled up
    /// @param playerAddress The player to award the lootbox to
    /// @return _lootboxTokenId The awarded lootbox token id (1-5)
    function awardLevelUpLootbox(address playerAddress) internal returns (uint256 _lootboxTokenId) {
        AppStorage storage s = LibDiamond.appStorage();
        // calc the lootbox rarity
        uint random = LibUtils.random(100);
        Rarity rarity = Rarity.level1;
        for (uint8 i = 1; i < s.rarities.length; i++) {
            if (random <= s.lootboxDropChance[s.rarities[i]]) {
                rarity = Rarity(i);
            }
        }
        _lootboxTokenId = s.lootboxIds[rarity];
        // mint the lootbox
        mint(playerAddress, _lootboxTokenId, 1);
    }

    /// @notice Open a lootbox
    /// @dev This function throws for queries about the zero address and non-existing players.
    /// @param playerAddress The player to query
    /// @param lootboxTokenId The lootbox to open
    function open(address playerAddress, uint256 lootboxTokenId) internal {
        AppStorage storage s = LibDiamond.appStorage();
        uint rewardFactor = s.rewardFactorByLootboxRarity[s.lootboxRarity[lootboxTokenId]];
        // calc the Matic reward according to the guild balance
        uint maticTreasuryBalance = s.communityMaticBalance > s.lootboxMaticBalance ? s.lootboxMaticBalance : s.communityMaticBalance;
        uint playerReward = (rewardFactor * (maticTreasuryBalance / s.nPlayers)) / 100;
        // add/remove randomly -20%..+20% to the player reward
        uint factor = LibUtils.random(40);
        playerReward = playerReward * (100 + factor - 20) / 100;
        // send the Matic reward to the player
        (bool success, bytes memory data) = address(playerAddress).call{value : playerReward, gas : s.transferGasLimit}("");
        if (!success) {
            revert(string.concat("Error during send transaction: ", string(data)));
        }
        // send guild tokens to the player
        LibTokens.mint(playerAddress, s.guildTokenId, s.guildTokensByLootbox[Rarity.level1], "0x0");
        // burn the lootbox
        LibTokens.burn(playerAddress, lootboxTokenId, 1);
        // adjust guild balances
        s.communityMaticBalance -= playerReward;
        if (s.communityMaticBalance < s.lootboxMaticBalance) {
            s.lootboxMaticBalance = s.communityMaticBalance / 2;
        }
        s.totalMaticBalance -= playerReward;
        s.totalOpenedLoootboxes++;
        s.players[playerAddress].totalOpenedLoootboxes++;
        s.lastLootboxContents[playerAddress] = LootboxContent(s.guildTokensByLootbox[Rarity.level1], playerReward);
        s.totalOpenedLoootboxesByPlayer[playerAddress][lootboxTokenId]++;
        s.totalMaticEarnedByPlayer[playerAddress] += playerReward;
        s.totalGuildTokenEarnedByPlayer[playerAddress] += s.guildTokensByLootbox[Rarity.level1];
        emit OpenLootboxEvent(playerAddress, lootboxTokenId);
    }

    /// @notice Mint a lootbox for a player
    /// @param playerAddress The player to mint the lootbox for
    /// @param lootboxTokenId The type of lootbox to mint
    /// @param amount The amount of lootboxes to mint
    function mint(address playerAddress, uint256 lootboxTokenId, uint256 amount) internal {
        AppStorage storage s = LibDiamond.appStorage();
        LibTokens.mint(playerAddress, lootboxTokenId, amount, "0x0");
        s.players[playerAddress].totalMintedLoootboxes += amount;
        s.totalMintedLoootboxesByPlayer[playerAddress][lootboxTokenId] += amount;
    }
}
