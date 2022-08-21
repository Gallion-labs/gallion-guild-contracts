import { ethers } from 'hardhat';
import { Address } from '../types';
import { PlayerFacet } from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { expect } from 'chai';
import { logTokensWon } from './utils';

const { deployDiamond } = require('../scripts/deployForTests.ts');
const { assert } = require('chai');

const Account = {
    Gallion: 0,
    NewOwner: 1,
    Admin1: 2,
    Admin2: 3,
    Player1: 4,
    Player2: 5
};

describe('Player Facet test', async function () {
    let accounts: SignerWithAddress[] = [];
    let diamondAddress: Address;

    before(async function () {
        accounts = await ethers.getSigners();
        diamondAddress = await deployDiamond([accounts[Account.Admin1].address], accounts[Account.Admin1].address, 50);
    });

    after(async function () {
        await new Promise(resolve => setTimeout(resolve, 10));
    });

    it('should add player 1', async () => {
        const playerFacet: PlayerFacet = (await ethers.getContractAt('PlayerFacet', diamondAddress) as PlayerFacet);
        await playerFacet
            .connect(accounts[Account.Admin1])
            .addPlayer(accounts[Account.Player1].address);
        const player: PlayerFacet.PlayerInfoStructOutput = await playerFacet
            .connect(accounts[Account.Player1])
            .player(accounts[Account.Player1].address);
        assert.exists(player.createdAt);
    });

    it('should levelUp player 1', async () => {
        const playerFacet: PlayerFacet = (await ethers.getContractAt('PlayerFacet', diamondAddress) as PlayerFacet);
        await playerFacet
            .connect(accounts[Account.Gallion])
            .levelUp(accounts[Account.Player1].address);
        const player: PlayerFacet.PlayerInfoStructOutput = await playerFacet
            .connect(accounts[Account.Player1])
            .player(accounts[Account.Player1].address);
        const balances: number[] = player.balances.map(balance => balance.toNumber());
        expect(balances).to.be.an('array').that.include(1);
        if (balances[1] === 1) {
            logTokensWon('Player1', 'Common lootbox', 1);
        }
        if (balances[2] === 1) {
            logTokensWon('Player1', 'Rare lootbox', 1);
        }
    });

    it('should remove player 1', async () => {
        const playerFacet: PlayerFacet = (await ethers.getContractAt('PlayerFacet', diamondAddress) as PlayerFacet);
        await playerFacet
            .connect(accounts[Account.Admin1])
            .removePlayer(accounts[Account.Player1].address);
        const player: PlayerFacet.PlayerInfoStructOutput | null = await playerFacet
            .connect(accounts[Account.Player1])
            .player(accounts[Account.Player1].address).catch(() => {
                return null;
            });
        assert.notExists(player);
    });
});
