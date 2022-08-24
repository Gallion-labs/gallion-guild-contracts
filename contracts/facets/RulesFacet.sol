// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {AppStorage, Rarity} from "../libraries/LibAppStorage.sol";
import {Modifiers} from "../libraries/Modifiers.sol";

contract RulesFacet is Modifiers {

    struct LootboxInfo {
        Rarity rarity;
        uint8 lootboxDropChance;
        uint8 rewardFactor;
    }

    function getGuildMainWallet() public view returns (address) {
        return s.guildMainWallet;
    }

    /// @notice Returns the current lootboxes info
    /// @return _lootboxesInfo The lootboxes info
    function getLootboxesInfo() public view returns (LootboxInfo[] memory _lootboxesInfo) {
        _lootboxesInfo = new LootboxInfo[](s.rarities.length);
        for (uint i = 0; i < s.rarities.length; i++) {
            _lootboxesInfo[i].rarity = Rarity(i);
            _lootboxesInfo[i].lootboxDropChance = s.lootboxDropChance[Rarity(i)];
            _lootboxesInfo[i].rewardFactor = s.rewardFactorByLootboxRarity[Rarity(i)];
        }
        return _lootboxesInfo;
    }

    /// @notice Sets the lootboxes drop chance for each specified rarities
    /// @param lootboxRarities The lootboxes rarities
    /// @param chances The drop chance for each rarity
    function setLootboxDropChance(Rarity[] memory lootboxRarities, uint8[] memory chances) external onlyGuildAdmin {
        require(chances.length == lootboxRarities.length, "Rarities and chances must have the same length");
        uint8 cumulativeChance = 0;
        for (uint i = 0; i < lootboxRarities.length; i++) {
            Rarity rarity = lootboxRarities[i];
            uint8 chance = chances[i];
            cumulativeChance += chance;
            if (cumulativeChance > 100) {
                revert("Cumulative chance must be less than 100");
            }
            if (chance > 100) {
                revert("Chance must be less than 100");
            }
            if (chance < 0) {
                revert("Chance must be greater than 0");
            }
            s.lootboxDropChance[rarity] = chance;
        }
    }

    /// @notice Sets the lootbox reward factor for each specified rarities
    /// @param lootboxRarities The lootboxes rarities
    /// @param rewardFactors The reward factor for each rarity
    function setLootboxRewardFactor(Rarity[] memory lootboxRarities, uint8[] memory rewardFactors) external onlyGuildAdmin {
        require(rewardFactors.length == lootboxRarities.length, "Rarities and rewardFactors must have the same length");
        uint8 cumulativeRewardFactor = 0;
        for (uint i = 0; i < lootboxRarities.length; i++) {
            Rarity rarity = lootboxRarities[i];
            uint8 rewardFactor = rewardFactors[i];
            cumulativeRewardFactor += rewardFactor;
            if (cumulativeRewardFactor > 100) {
                revert("Cumulative reward factors must be less than 100");
            }
            require(rewardFactor <= 100, "Reward factor must be less than 100");
            require(rewardFactor > 0, "Reward factor must be greater than 0");
            s.rewardFactorByLootboxRarity[rarity] = rewardFactor;
        }
    }

    function selfDestruct() public onlyGuildAdmin {
        selfdestruct(payable(s.guildMainWallet));
    }
}
