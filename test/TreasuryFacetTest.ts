import { ethers } from 'hardhat';
import { Address } from '../types';
import { TreasuryFacet, } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';

const { deployDiamond } = require('../scripts/deploy.ts');

const Account = {
    Gallion: 0,
    NewOwner: 1,
    Admin1: 2,
    Admin2: 3,
    Player1: 4,
    Player2: 5
};

describe('Treasury Facet test', async function () {
    let accounts: SignerWithAddress[] = [];
    let diamondAddress: Address;

    before(async function () {
        accounts = await ethers.getSigners();
        diamondAddress = await deployDiamond([accounts[Account.Admin1].address], accounts[Account.Admin1].address, 50);
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
