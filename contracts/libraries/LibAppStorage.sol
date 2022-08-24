// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {LibMeta} from "./LibMeta.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

struct AppStorage {
    bytes32 domainSeparator;
    address gallionLabs;
    address guildMainWallet;
    uint256 guildTokenId; // Guild token id (ERC1155)
    Rarity[] rarities;
    mapping(Rarity => uint256) lootboxIds; // Lootbox id by rarity (ERC1155)
    mapping(uint256 => Rarity) lootboxRarity; // Lootbox rarity by id (ERC1155)
    mapping(uint256 => mapping(address => uint256)) _balances; // Tokens balances (ERC1155)
    mapping(address => uint256) investments;
    mapping(Rarity => uint256) guildTokensByLootbox; // Guild tokens by lootbox rarity (ERC1155)
    uint256 totalMintedLoootboxes;
    uint256 totalOpenedLoootboxes;
    uint256 totalMaticBalance;
    uint256 communityMaticBalance;
    uint256 lootboxMaticBalance;
    uint8 rewardRatioFromIncome; // From 1 to 100 (%)
    mapping(Rarity => uint8) lootboxDropChance; // From 1 to 100 (%)
    mapping(Rarity => uint8) rewardFactorByLootboxRarity; // From 1 to 100 (%)
    mapping(address => Admin) guildAdmins;
    mapping(address => Player) players;
    uint32 transferGasLimit;
    uint256 nPlayers;
    bool locked;
    string uri;
}

struct Admin {
    uint createdAt;
}

struct Player {
    uint createdAt;
    uint256 totalMintedLoootboxes;
    uint256 totalOpenedLoootboxes;
}

enum Rarity {
    level1,
    level2,
    level3,
    level4,
    level5
}
