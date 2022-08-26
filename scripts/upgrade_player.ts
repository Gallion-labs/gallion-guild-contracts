import { FacetCutAction, getSelector, getSelectors } from './libraries/diamond';
import { Contract, ContractReceipt, ContractTransaction, ethers } from 'ethers';
import { Address } from '../types';
import Debug from 'debug';
import chalk from 'chalk';
import PlayerFacetArtifact from '../artifacts/contracts/facets/PlayerFacet.sol/PlayerFacet.json';
import {
    DiamondCutFacet,
    DiamondCutFacet__factory,
    DiamondLoupeFacet,
    DiamondLoupeFacet__factory
} from '../typechain-types';
import { GasStation, GasStationData } from './gasStation';
import { Network } from '@ethersproject/networks';
import { FacetAndAddSelectors, getSighashes } from './utils';

const debug = Debug('gallion:contracts:upgrade');

async function upgradeDiamond(diamondAddress: string): Promise<Address> {
    const gasStationData: GasStationData = await GasStation.getGasData();
    const matic: Network = {
        name: 'matic',
        chainId: 137,
        _defaultProvider: (providers) => new providers.JsonRpcProvider('https://polygon-rpc.com')
    }
    const provider = ethers.getDefaultProvider(matic);

    const account = new ethers.Wallet(
        process.env.ITEM_MANAGER as string,
        provider
    );


    const newFuncs = [
        getSelector('function addPlayer(address playerAddress) external'),
        getSelector('function fixLootboxesByPlayer(address playerAddress) external')
    ]

    // deploy Player Facet
    const PlayerFacet = await new ethers.ContractFactory(PlayerFacetArtifact.abi, PlayerFacetArtifact.bytecode, account);
    const playerFacet = await PlayerFacet.deploy(gasStationData);
    await playerFacet.deployed();
    debug(chalk.grey(`PlayerFacet deployed: ${ chalk.greenBright(playerFacet.address) }`));


    let existingFuncs: string[] = getSelectors(playerFacet)
    for (const selector of newFuncs) {
        if (!existingFuncs.includes(selector)) {
            throw Error(`Selector ${selector} not found`)
        }
    }
    existingFuncs = existingFuncs.filter(selector => !newFuncs.includes(selector))

    const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 }

    const cut: Cut[] = [
        {
            facetAddress: playerFacet.address,
            action: FacetCutAction.Replace as Cut['action'],
            functionSelectors: newFuncs
        }
    ]

    //Execute the Cut
    const diamondCut = await new Contract(diamondAddress, DiamondCutFacet__factory.abi, account) as DiamondCutFacet;
    const diamondLoupe = await new Contract(diamondAddress, DiamondLoupeFacet__factory.abi, account) as DiamondLoupeFacet;

    const tx: ContractTransaction = await diamondCut.diamondCut(
        cut,
        ethers.constants.AddressZero,
        '0x',
        gasStationData
    );

    const receipt: ContractReceipt = await tx.wait();
    if (!receipt.status) {
        throw Error(`Diamond upgrade failed: ${ tx.hash }`);
    }
    debug(chalk.green(`Completed diamond cut: ${ chalk.dim(tx.hash) }`));

    return playerFacet.address;
}

export { upgradeDiamond };

interface Cut {
    facetAddress: string;
    action: 0 | 1 | 2;
    functionSelectors: string[];
}
