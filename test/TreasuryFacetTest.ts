import { ethers } from 'hardhat';
import { Address } from '../types';
import { DiamondCutFacet, DiamondLoupeFacet, GuildDiamond, OwnershipFacet, RulesFacet, TreasuryFacet, } from '../typechain-types';
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

describe('Treasury Facet test', async function () {
    let accounts: SignerWithAddress[] = [];
    let diamondAddress: Address;
    let tokenAddress: Address;
    let lootboxAddress: Address;
    let guildContract: GuildDiamond;
    let diamondCutFacet: DiamondCutFacet;
    let diamondLoupeFacet: DiamondLoupeFacet;
    let ownershipFacet: OwnershipFacet;
    let treasuryFacet: TreasuryFacet;

    before(async function () {
        accounts = await ethers.getSigners();
        diamondAddress = await deployDiamond(tokenAddress, lootboxAddress);
        guildContract = (await ethers.getContractAt('GuildDiamond', diamondAddress) as GuildDiamond);
        diamondCutFacet = (await ethers.getContractAt('DiamondCutFacet', diamondAddress) as DiamondCutFacet);
        diamondLoupeFacet = (await ethers.getContractAt('DiamondLoupeFacet', diamondAddress) as DiamondLoupeFacet);
        ownershipFacet = (await ethers.getContractAt('OwnershipFacet', diamondAddress) as OwnershipFacet);
        treasuryFacet = (await ethers.getContractAt('TreasuryFacet', diamondAddress) as TreasuryFacet);
    });

    after(async function () {
        await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should set reward ratio from income', async () => {
        const treasuryFacet: TreasuryFacet = (await ethers.getContractAt('TreasuryFacet', diamondAddress) as TreasuryFacet);
        await treasuryFacet
            .connect(accounts[Account.Admin1])
            .setRewardRatioFromIncome(60);
        const rewardRatio = await treasuryFacet.getRewardRatioFromIncome();
        expect(rewardRatio).to.equal(60);
    });
});
