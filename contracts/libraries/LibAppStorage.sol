// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

    struct AppStorage {
        address gallionLabs;
        address guildTokenContract;
        address guildContract;
        mapping(address => bool) playersExists;
        mapping(address => Player) players;
        mapping(uint32 => Lootbox) lootboxes;
    }

    struct Player {
        address owner;
        uint16 level;
    }

    struct Lootbox {
        address owner;
        Rarity rarity;
    }

    enum Rarity {
        common,
        rare,
        epic,
        legendary
    }
