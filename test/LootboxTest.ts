import { ethers } from 'hardhat';
import { Address } from '../types';
import { LootboxFacet, PlayerFacet, TokensFacet } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { BigNumber } from 'ethers';
import { logTokensWon } from './utils';

const { deployDiamond } = require('../scripts/deployForTests.ts');

const Account = {
    Gallion: 0,
    NewOwner: 1,
    Admin1: 2,
    Admin2: 3,
    Player1: 4,
    Player2: 5
};

describe('Lootbox Facet test', async function () {
    let accounts: SignerWithAddress[] = [];
    let diamondAddress: Address;
    let tokensFacet: TokensFacet;
    let playerFacet: PlayerFacet;
    let lootboxFacet: LootboxFacet;

    before(async function () {
        accounts = await ethers.getSigners();
        diamondAddress = await deployDiamond([accounts[Account.Admin1].address], accounts[Account.Admin1].address, 50);
        tokensFacet = (await ethers.getContractAt('TokensFacet', diamondAddress) as TokensFacet);
        playerFacet = (await ethers.getContractAt('PlayerFacet', diamondAddress) as PlayerFacet);
        lootboxFacet = (await ethers.getContractAt('LootboxFacet', diamondAddress) as LootboxFacet);
        // Send Matic to the guild contract
        await accounts[Account.Admin2].sendTransaction({
            to: diamondAddress,
            value: ethers.utils.parseEther('1000') // 1000 Matic tokens
        });
        // Create player 1
        await playerFacet
            .connect(accounts[Account.Admin1])
            .addPlayer(accounts[Account.Player1].address);
    });

    after(async function () {
        await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should mint a lvl1 lootbox for player 1', async () => {
        await lootboxFacet
            .connect(accounts[Account.Gallion])
            .award(accounts[Account.Player1].address, LootboxTokenIds.Level1, 1);
        const p1Lootboxes = await lootboxFacet.list(accounts[Account.Player1].address);

        expect(p1Lootboxes[LootboxTokenIds.Level1 - 1].toNumber()).to.equal(1);
    });

    it('should open the first lvl1 lootbox of player 1', async () => {
        const player1Address = accounts[Account.Player1].address;
        await lootboxFacet
            .connect(accounts[Account.Gallion])
            .open(player1Address, LootboxTokenIds.Level1);

        const p1Lootboxes = await lootboxFacet.list(accounts[Account.Player1].address);
        expect(p1Lootboxes[LootboxTokenIds.Level1 - 1].toNumber()).to.equal(0, 'Player 1 should not have any lootboxes anymore');
        const playerRawMaticBalance: BigNumber = await ethers.provider.getBalance(accounts[Account.Player1].address);
        const playerMaticBalance = parseInt(ethers.utils.formatEther(playerRawMaticBalance));
        const playerGuildTokenBalance = await tokensFacet.balanceOf(accounts[Account.Player1].address, 0);
        expect(playerMaticBalance).to.be.above(10_000, 'Player 1 should have some Matic tokens');
        logTokensWon('Player1', 'Matic tokens', playerMaticBalance - 10_000);
        logTokensWon('Player1', 'Guild tokens', playerGuildTokenBalance.toNumber());
    });
});


enum LootboxTokenIds {
    Level1 = 1,
    Level2 = 2,
    Level3 = 3,
    Level4 = 4,
    Level5 = 5
}
