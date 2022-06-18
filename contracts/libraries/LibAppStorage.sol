// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {LibDiamond} from "./LibDiamond.sol";
import {LibMeta} from "./LibMeta.sol";

struct AppStorage {
    bytes32 domainSeparator;
    address owner;
    address gallionLabs;
    address guildTokenContract;
    address guildContract;
    mapping(address => Admin) guildAdmins;
    mapping(address => Player) players;
    mapping(uint32 => Lootbox) lootboxes;
}

struct Admin {
    uint createdAt;
}

struct Player {
    uint createdAt;
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

contract Modifiers {
    AppStorage internal s;

    modifier onlyGuildAdmin() {
        require(s.guildAdmins[LibMeta.msgSender()].createdAt > 0, "LibAppStorage: Only guild admins can call this function");
        _;
    }

    modifier playerExists(address player) {
        require(s.players[player].createdAt > 0, "LibAppStorage: Player does not exist");
        _;
    }

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    modifier onlyGallion() {
        require(LibMeta.msgSender() == s.gallionLabs, "LibAppStorage: Only Gallion can call this function");
        _;
    }
}
