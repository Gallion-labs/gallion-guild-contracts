import { FacetCutAction, getSelectors } from './libraries/diamond';
import { ethers, providers } from 'ethers';
import { Address } from '../types';
import Debug from 'debug';
import chalk from 'chalk';
import DiamondCutFacetArtifact from '../artifacts/contracts/facets/DiamondCutFacet.sol/DiamondCutFacet.json';
import GuildDiamondArtifact from '../artifacts/contracts/GuildDiamond.sol/GuildDiamond.json';
import DiamondInitArtifact from '../artifacts/contracts/upgradeInitializers/DiamondInit.sol/DiamondInit.json';
import DiamondLoupeFacetArtifact from '../artifacts/contracts/facets/DiamondLoupeFacet.sol/DiamondLoupeFacet.json';
import OwnershipFacetArtifact from '../artifacts/contracts/facets/OwnershipFacet.sol/OwnershipFacet.json';
import TokensFacetArtifact from '../artifacts/contracts/facets/TokensFacet.sol/TokensFacet.json';
import RulesFacetArtifact from '../artifacts/contracts/facets/RulesFacet.sol/RulesFacet.json';
import TreasuryFacetArtifact from '../artifacts/contracts/facets/TreasuryFacet.sol/TreasuryFacet.json';
import PlayerFacetArtifact from '../artifacts/contracts/facets/PlayerFacet.sol/PlayerFacet.json';
import LootboxFacetArtifact from '../artifacts/contracts/facets/LootboxFacet.sol/LootboxFacet.json';
import IDiamondCutArtifact from '../artifacts/contracts/interfaces/IDiamondCut.sol/IDiamondCut.json';
import { DiamondCutFacet } from '../typechain-types';

const debug = Debug('gallion:contracts:deploy');

async function deployDiamond(guildAdmins: string[], guildMainWallet: string, rewardRatioFromIncome: number): Promise<Address> {
    const provider = new ethers.providers.JsonRpcProvider("https://polygon-rpc.com");
    const account = new ethers.Wallet(
        process.env.ITEM_MANAGER as string,
        provider
    );

    // deploy DiamondCutFacet
    const DiamondCutFacet = await new ethers.ContractFactory(DiamondCutFacetArtifact.abi, DiamondCutFacetArtifact.bytecode, account);
    const diamondCutFacet = await DiamondCutFacet.deploy();
    await diamondCutFacet.deployed();
    debug(chalk.grey(`DiamondCutFacet deployed: ${ chalk.greenBright(diamondCutFacet.address) }`));

    // deploy Guild Diamond
    const GuildDiamond = await new ethers.ContractFactory(GuildDiamondArtifact.abi, GuildDiamondArtifact.bytecode, account);
    const diamond = await GuildDiamond.deploy(account, diamondCutFacet.address);
    await diamond.deployed();
    debug(chalk.grey(`Diamond deployed: ${ chalk.greenBright(diamond.address) }`));

    // deploy DiamondInit
    // DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
    // Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
    const DiamondInit = await new ethers.ContractFactory(DiamondInitArtifact.abi, DiamondInitArtifact.bytecode, account);
    const diamondInit = await DiamondInit.deploy();
    await diamondInit.deployed();
    debug(chalk.grey(`DiamondInit deployed: ${ chalk.greenBright(diamondInit.address) }`));

    // deploy facets
    const facets = [
        {
            name: 'DiamondLoupeFacet',
            contract: await new ethers.ContractFactory(DiamondLoupeFacetArtifact.abi, DiamondLoupeFacetArtifact.bytecode, account)
        },
        {
            name: 'OwnershipFacet',
            contract: await new ethers.ContractFactory(OwnershipFacetArtifact.abi, OwnershipFacetArtifact.bytecode, account)
        },
        {
            name: 'TokensFacet',
            contract: await new ethers.ContractFactory(TokensFacetArtifact.abi, TokensFacetArtifact.bytecode, account)
        },
        {
            name: 'RulesFacet',
            contract: await new ethers.ContractFactory(RulesFacetArtifact.abi, RulesFacetArtifact.bytecode, account)
        },
        {
            name: 'TreasuryFacet',
            contract: await new ethers.ContractFactory(TreasuryFacetArtifact.abi, TreasuryFacetArtifact.bytecode, account)
        },
        {
            name: 'PlayerFacet',
            contract: await new ethers.ContractFactory(PlayerFacetArtifact.abi, PlayerFacetArtifact.bytecode, account)
        },
        {
            name: 'LootboxFacet',
            contract: await new ethers.ContractFactory(LootboxFacetArtifact.abi, LootboxFacetArtifact.bytecode, account)
        }
    ];
    debug(chalk.grey(`Deploying ${ facets.length } facets...`));
    const cut = [];
    for (const Facet of facets) {
        const facet = await Facet.contract.deploy();
        await facet.deployed();
        debug(chalk.grey(`    ${ Facet.name } deployed: ${ chalk.greenBright(facet.address) }`));
        cut.push({
            facetAddress: facet.address,
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(facet)
        });
    }

    // upgrade diamond with facets
    debug(chalk.grey(`Upgrading diamond to add facets...`));
    const diamondCutFactory = await new ethers.ContractFactory(IDiamondCutArtifact.abi, IDiamondCutArtifact.bytecode, account);
    // const diamondCut = await ethers.ContractFactory('IDiamondCut', diamond.address);
    const diamondCut = diamondCutFactory.attach(diamond.address) as DiamondCutFacet;
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
