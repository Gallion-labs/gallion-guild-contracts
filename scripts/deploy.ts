import { FacetCutAction, getSelectors } from './libraries/diamond';
import { ethers } from 'hardhat';
import { Address } from '../types';
import Debug from 'debug';
import chalk from 'chalk';

const debug = Debug('gallion:contracts:deploy');

async function deployDiamond(guildAdmins: string[], guildMainWallet: string, rewardRatioFromIncome: number): Promise<Address> {
    const accounts = await ethers.getSigners()
    const account = await accounts[0].getAddress()

    // deploy DiamondCutFacet
    const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet');
    const diamondCutFacet = await DiamondCutFacet.deploy();
    await diamondCutFacet.deployed();
    debug(chalk.grey(`DiamondCutFacet deployed: ${ chalk.greenBright(diamondCutFacet.address) }`));

    // deploy Guild Diamond
    const GuildDiamond = await ethers.getContractFactory('GuildDiamond');
    const diamond = await GuildDiamond.deploy(account, diamondCutFacet.address);
    await diamond.deployed();
    debug(chalk.grey(`Diamond deployed: ${ chalk.greenBright(diamond.address) }`));

    // deploy DiamondInit
    // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
    // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
    const DiamondInit = await ethers.getContractFactory('DiamondInit');
    const diamondInit = await DiamondInit.deploy();
    await diamondInit.deployed();
    debug(chalk.grey(`DiamondInit deployed: ${ chalk.greenBright(diamondInit.address) }`));

    // deploy facets
    const facetNames = [
        'DiamondLoupeFacet',
        'OwnershipFacet',
        'TokensFacet',
        'RulesFacet',
        'TreasuryFacet',
        'PlayerFacet',
        'LootboxFacet'
    ];
    debug(chalk.grey(`Deploying ${ facetNames.length } facets...`));
    const cut = [];
    for (const facetName of facetNames) {
        const Facet = await ethers.getContractFactory(facetName);
        const facet = await Facet.deploy();
        await facet.deployed();
        debug(chalk.grey(`    ${ facetName } deployed: ${ chalk.greenBright(facet.address) }`));
        cut.push({
            facetAddress: facet.address,
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(facet)
        });
    }

    // upgrade diamond with facets
    debug(chalk.grey(`Upgrading diamond to add facets...`));
    const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address);
    let tx;
    let receipt;
    // call to init function
    let functionCall = diamondInit.interface.encodeFunctionData('init', [
        {
            gallionLabs: account,
            guildAdmins,
            rewardRatioFromIncome,
            guildMainWallet
        }
    ]);
    tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
    // debug('Diamond cut tx: ', tx.hash);
    receipt = await tx.wait();
    if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${ tx.hash }`);
    }
    debug(chalk.greenBright(`Diamond successfully upgraded. Done.`));
    return diamond.address as Address;
}

export { deployDiamond };
