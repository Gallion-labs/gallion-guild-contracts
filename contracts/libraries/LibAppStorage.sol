// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {LibDiamond} from "./LibDiamond.sol";
import {LibMeta} from "./LibMeta.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

struct AppStorage {
    bytes32 domainSeparator;
    address gallionLabs;
    address guildContract;
    uint256 guildTokenId; // Guild token id (ERC1155)
    Rarity[] rarities;
    mapping(Rarity => uint256) lootboxIds; // Lootbox id by rarity (ERC1155)
    mapping(uint256 => Rarity) lootboxRarity; // Lootbox rarity by id (ERC1155)
    mapping(uint256 => mapping(address => uint256)) _balances; // Tokens balances (ERC1155)
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
}

struct Admin {
    uint createdAt;
}

struct Player {
    uint createdAt;
    uint16 level;
}

enum Rarity {
    level1,
    level2,
    level3,
    level4,
    level5
}

contract Modifiers {
    AppStorage internal s;

    modifier onlyGuildAdmin() {
        require(s.guildAdmins[LibMeta.msgSender()].createdAt > 0, "NOT_ALLOWED: Only guild admins can call this function");
        _;
    }

    modifier playerExists(address player) {
        require(player != address(0), "NOT_ALLOWED: Player address is not valid");
        require(s.players[player].createdAt > 0, "NOT_ALLOWED: Player does not exist");
        _;
    }

    modifier playerNotExists(address player) {
        require(player != address(0), "NOT_ALLOWED: Player address is not valid");
        require(!(s.players[player].createdAt > 0), "NOT_ALLOWED: Player already exists");
        _;
    }

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    modifier onlyGallion() {
        require(LibMeta.msgSender() == s.gallionLabs, "NOT_ALLOWED: Only Gallion can call this function");
        _;
    }

    modifier protectedCall() {
        LibDiamond.enforceIsContractOwner();
        require(LibMeta.msgSender() == address(this),
            "NOT_ALLOWED: Only Owner or this contract can call this function");
        _;
    }

    modifier noReentrant() {
        require(!s.locked, "No re-entrancy");
        s.locked = true;
        _;
        s.locked = false;
    }
}
