// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IDiamondLoupe} from "../interfaces/IDiamondLoupe.sol";
import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {IERC173} from "../interfaces/IERC173.sol";
import {IERC165} from "../interfaces/IERC165.sol";
import {AppStorage, Admin, Rarity} from "../libraries/LibAppStorage.sol";
import {LibMeta} from "../libraries/LibMeta.sol";
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract DiamondInit {
    AppStorage internal s;

    struct Args {
        address gallionLabs;
        address[] guildAdmins;
        uint8 rewardRatioFromIncome;
    }

    function init(Args memory _args) external {
        s.gallionLabs = _args.gallionLabs;
        require(_args.rewardRatioFromIncome >= 0 && _args.rewardRatioFromIncome <= 100, "Invalid reward ratio, must be between 0 and 100");
        s.rewardRatioFromIncome = _args.rewardRatioFromIncome;

        s.guildTokenId = 0;
        s.lootboxIds[Rarity.level1] = 1;
        s.lootboxIds[Rarity.level2] = 2;
        s.lootboxIds[Rarity.level3] = 3;
        s.lootboxIds[Rarity.level4] = 4;
        s.lootboxIds[Rarity.level5] = 5;

        s.lootboxDropChance[Rarity.level1] = 75;
        s.lootboxDropChance[Rarity.level2] = 25;

        s.rewardFactorByLootboxRarity[Rarity.level1] = 8;
        s.rewardFactorByLootboxRarity[Rarity.level2] = 16;
        s.rewardFactorByLootboxRarity[Rarity.level3] = 32;
        s.rewardFactorByLootboxRarity[Rarity.level4] = 64;
        s.rewardFactorByLootboxRarity[Rarity.level5] = 100;

        s.guildTokensByLootbox[Rarity.level1] = 100;
        s.guildTokensByLootbox[Rarity.level2] = 200;
        s.guildTokensByLootbox[Rarity.level3] = 400;
        s.guildTokensByLootbox[Rarity.level4] = 1000;
        s.guildTokensByLootbox[Rarity.level5] = 5000;

        s.transferGasLimit = 2000000;
        s.nPlayers = 0;
        s.totalMaticBalance = 0;
        s.communityMaticBalance = 0;

        for (uint i = 0; i < _args.guildAdmins.length; i++) {
            s.guildAdmins[_args.guildAdmins[i]] = Admin(block.timestamp);
        }

        s.domainSeparator = LibMeta.domainSeparator("GallionDiamond", "V1");

        // adding ERC165 data
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
        ds.supportedInterfaces[type(IERC1155).interfaceId] = true;
    }
}
