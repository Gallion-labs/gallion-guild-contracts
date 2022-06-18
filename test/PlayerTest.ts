import {ethers} from 'hardhat';
import {Address} from '../types';
import {DiamondCutFacet, DiamondLoupeFacet, GuildDiamond, OwnershipFacet, PlayerFacet} from '../typechain-types';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {PlayerStructOutput} from '../typechain-types/facets/PlayerFacet';

const {deployDiamond} = require('../scripts/deploy.ts');
const {assert} = require('chai');

const Account = {
    Owner: 0,
    NewOwner: 1,
    Admin1: 2,
    Admin2: 3,
    Player1: 4,
    Player2: 5,
    Gallion: 9
};

describe('Player Facet test', async function () {
    let accounts: SignerWithAddress[] = [];
    let diamondAddress: Address;
    let guildContract: GuildDiamond;
    let diamondCutFacet: DiamondCutFacet;
    let diamondLoupeFacet: DiamondLoupeFacet;
    let ownershipFacet: OwnershipFacet;
    let playerFacet: PlayerFacet;

    before(async function () {
        accounts = await ethers.getSigners();
        diamondAddress = await deployDiamond();
        guildContract = (await ethers.getContractAt('GuildDiamond', diamondAddress) as GuildDiamond);
        diamondCutFacet = (await ethers.getContractAt('DiamondCutFacet', diamondAddress) as DiamondCutFacet);
        diamondLoupeFacet = (await ethers.getContractAt('DiamondLoupeFacet', diamondAddress) as DiamondLoupeFacet);
        ownershipFacet = (await ethers.getContractAt('OwnershipFacet', diamondAddress) as OwnershipFacet);
        playerFacet = (await ethers.getContractAt('PlayerFacet', diamondAddress) as PlayerFacet);
    });

    it('should add player 1', async () => {
        const playerFacet: PlayerFacet = (await ethers.getContractAt('PlayerFacet', diamondAddress) as PlayerFacet);
        await playerFacet
            .connect(accounts[Account.Admin1])
            .addPlayer(accounts[Account.Player1].address);
        const player: PlayerStructOutput = await playerFacet
            .connect(accounts[Account.Player1])
            .player(accounts[Account.Player1].address);
        assert.exists(player.createdAt);
    });

    it('should levelUp player 1', async () => {
        const playerFacet: PlayerFacet = (await ethers.getContractAt('PlayerFacet', diamondAddress) as PlayerFacet);
        await playerFacet
            .connect(accounts[Account.Gallion])
            .levelUp(accounts[Account.Player1].address);
        const player: PlayerStructOutput = await playerFacet
            .connect(accounts[Account.Player1])
            .player(accounts[Account.Player1].address);
        assert.equal(player.level, 1);
    });
});
