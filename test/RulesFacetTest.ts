import { ethers } from 'hardhat';
import { Address } from '../types';
import { DiamondCutFacet, DiamondLoupeFacet, GuildDiamond, OwnershipFacet, RulesFacet, } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

const { deployDiamond } = require('../scripts/deployForTests.ts');
const { assert } = require('chai');

const Account = {
    Owner: 0,
    NewOwner: 1,
    Admin1: 2,
    Admin2: 3,
    Player1: 4,
    Player2: 5,
    Gallion: 9
};

describe('Rules Facet test', async function () {
    let accounts: SignerWithAddress[] = [];
    let diamondAddress: Address;
    let tokenAddress: Address;
    let lootboxAddress: Address;
    let guildContract: GuildDiamond;
    let diamondCutFacet: DiamondCutFacet;
    let diamondLoupeFacet: DiamondLoupeFacet;
    let ownershipFacet: OwnershipFacet;
    let rulesFacet: RulesFacet;

    before(async function () {
        accounts = await ethers.getSigners();
        diamondAddress = await deployDiamond(tokenAddress, lootboxAddress);
        guildContract = (await ethers.getContractAt('GuildDiamond', diamondAddress) as GuildDiamond);
        diamondCutFacet = (await ethers.getContractAt('DiamondCutFacet', diamondAddress) as DiamondCutFacet);
        diamondLoupeFacet = (await ethers.getContractAt('DiamondLoupeFacet', diamondAddress) as DiamondLoupeFacet);
        ownershipFacet = (await ethers.getContractAt('OwnershipFacet', diamondAddress) as OwnershipFacet);
        rulesFacet = (await ethers.getContractAt('RulesFacet', diamondAddress) as RulesFacet);
    });

    after(async function () {
        await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should set lootbox drop chances by rarity', async () => {
        const rulesFacet: RulesFacet = (await ethers.getContractAt('RulesFacet', diamondAddress) as RulesFacet);
        await rulesFacet
            .connect(accounts[Account.Admin1])
            .setLootboxDropChance([0, 1, 2, 3, 4], [50, 30, 10, 7, 3]);
        const lootboxesInfo = await rulesFacet.getLootboxesInfo();
        expect(lootboxesInfo).to.be.an('array').that.has.lengthOf(5);
        expect(lootboxesInfo[0].lootboxDropChance).to.equal(50);
        expect(lootboxesInfo[1].lootboxDropChance).to.equal(30);
        expect(lootboxesInfo[2].lootboxDropChance).to.equal(10);
        expect(lootboxesInfo[3].lootboxDropChance).to.equal(7);
        expect(lootboxesInfo[4].lootboxDropChance).to.equal(3);
    });

    it('should set lootbox reward factor by rarity', async () => {
        const rulesFacet: RulesFacet = (await ethers.getContractAt('RulesFacet', diamondAddress) as RulesFacet);
        await rulesFacet
            .connect(accounts[Account.Admin1])
            .setLootboxRewardFactor([0, 1, 2, 3, 4], [5, 10, 15, 20, 50]);
        const lootboxesInfo = await rulesFacet.getLootboxesInfo();
        expect(lootboxesInfo).to.be.an('array').that.has.lengthOf(5);
        expect(lootboxesInfo[0].rewardFactor).to.equal(5);
        expect(lootboxesInfo[1].rewardFactor).to.equal(10);
        expect(lootboxesInfo[2].rewardFactor).to.equal(15);
        expect(lootboxesInfo[3].rewardFactor).to.equal(20);
        expect(lootboxesInfo[4].rewardFactor).to.equal(50);
    });
});
