import { FacetCutAction, getSelectors } from './libraries/diamond';
import { Contract, ContractReceipt, ContractTransaction, ethers } from 'ethers';
import { Address } from '../types';
import Debug from 'debug';
import chalk from 'chalk';
import TokensFacetArtifact from '../artifacts/contracts/facets/TokensFacet.sol/TokensFacet.json';
import { DiamondCutFacet, DiamondCutFacet__factory, DiamondLoupeFacet, DiamondLoupeFacet__factory } from '../typechain-types';
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

    const facetAndAddSelectors: FacetAndAddSelectors = {
        facetName: 'TokensFacet',
        addSelectors: [
            'function setUri(string uri) public'
        ],
        removeSelectors: [],
    };

    //Create the cut
    const cut: Cut[] = [];

    // deploy Tokens Facet
    const TokensFacet = await new ethers.ContractFactory(TokensFacetArtifact.abi, TokensFacetArtifact.bytecode, account);
    const tokensFacet = await TokensFacet.deploy(gasStationData);
    await tokensFacet.deployed();
    debug(chalk.grey(`TokensFacet deployed: ${ chalk.greenBright(tokensFacet.address) }`));
    const newSelectors = getSighashes(facetAndAddSelectors.addSelectors);

    let existingFuncs = getSelectors(tokensFacet);
    for (const selector of newSelectors) {
        if (!existingFuncs.includes(selector)) {
            const index = newSelectors.findIndex((val) => val == selector);

            throw Error(
                `Selector ${ selector } (${ facetAndAddSelectors.addSelectors[index] }) not found`
            );
        }
    }

    const existingSelectors = getSelectors(tokensFacet);
    const existingSelectorsHashes = existingSelectors.filter(
        (selector) => !newSelectors.includes(selector)
    );
    if (newSelectors.length > 0) {
        cut.push({
            facetAddress: tokensFacet.address,
            action: FacetCutAction.Add as Cut['action'],
            functionSelectors: newSelectors,
        });
    }

    //Always replace the existing selectors to prevent duplications
    if (existingSelectorsHashes.length > 0) {
        cut.push({
            facetAddress: tokensFacet.address,
            action: FacetCutAction.Replace as Cut['action'],
            functionSelectors: existingSelectorsHashes,
        });
    }

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

    return tokensFacet.address;
}

export { upgradeDiamond };

interface Cut {
    facetAddress: string;
    action: 0 | 1 | 2;
    functionSelectors: string[];
}
