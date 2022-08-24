import { FacetCutAction, getSelectors } from './libraries/diamond';
import { Contract, ContractReceipt, ContractTransaction, ethers } from 'ethers';
import Debug from 'debug';
import chalk from 'chalk';
import LootboxFacetArtifact from '../artifacts/contracts/facets/LootboxFacet.sol/LootboxFacet.json';
import TokensFacetArtifact from '../artifacts/contracts/facets/TokensFacet.sol/TokensFacet.json';
import PlayerFacetArtifact from '../artifacts/contracts/facets/PlayerFacet.sol/PlayerFacet.json';
import { DiamondCutFacet, DiamondCutFacet__factory, DiamondLoupeFacet, DiamondLoupeFacet__factory } from '../typechain-types';
import { GasStation, GasStationData } from './gasStation';
import { Network } from '@ethersproject/networks';
import { FacetAndAddSelectors, getSighashes } from './utils';

const debug = Debug('gallion:contracts:upgrade');

async function upgradeDiamond(diamondAddress: string) {
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

    const lootboxFacetAndAddSelectors: FacetAndAddSelectors = {
        facetName: 'LootboxFacet',
        addSelectors: [
            'function getLastLootboxContents(address playerAddress) public view returns (LootboxContent[] memory)',
            'function open(address playerAddress, uint256 lootboxTokenId) external',
            'function award(address playerAddress, uint256 lootboxTokenId, uint256 amount) public',
        ],
        removeSelectors: []
    };

    const tokensFacetAndAddSelectors: FacetAndAddSelectors = {
        facetName: 'TokensFacet',
        addSelectors: [
            'function name() external view returns (string memory)',
            'function symbol() external view returns (string memory)',
            'function setName(string memory _symbol) public',
            'function setSymbol(string memory baseUri) public'
        ],
        removeSelectors: [],
    };

    const playerFacetAndAddSelectors: FacetAndAddSelectors = {
        facetName: 'PlayerFacet',
        addSelectors: [
            'function playerTotalMintedLootboxes(address playerAddress) public view returns (uint256[] memory)',
            'function playerTotalOpenedLootboxes(address playerAddress) public view returns (uint256[] memory)',
            'function playerTotalMaticEarned(address playerAddress) public view returns (uint256)',
            'function playerTotalGuildTokenEarned(address playerAddress) public view returns (uint256)'
        ],
        removeSelectors: [],
    };

    // Create the cut
    const cut: Cut[] = [];

    // Deploy Facets
    const LootboxFacet = await new ethers.ContractFactory(LootboxFacetArtifact.abi, LootboxFacetArtifact.bytecode, account);
    const lootboxFacet = await LootboxFacet.deploy(gasStationData);
    await lootboxFacet.deployed();
    debug(chalk.grey(`lootboxFacet deployed: ${ chalk.greenBright(lootboxFacet.address) }`));
    const TokensFacet = await new ethers.ContractFactory(TokensFacetArtifact.abi, TokensFacetArtifact.bytecode, account);
    const tokensFacet = await TokensFacet.deploy(gasStationData);
    await tokensFacet.deployed();
    debug(chalk.grey(`TokensFacet deployed: ${ chalk.greenBright(tokensFacet.address) }`));
    const PlayerFacet = await new ethers.ContractFactory(PlayerFacetArtifact.abi, PlayerFacetArtifact.bytecode, account);
    const playerFacet = await PlayerFacet.deploy(gasStationData);
    await playerFacet.deployed();
    debug(chalk.grey(`PlayerFacet deployed: ${ chalk.greenBright(playerFacet.address) }`));

    const lootboxNewSelectors = getSighashes(lootboxFacetAndAddSelectors.addSelectors);
    const tokensNewSelectors = getSighashes(tokensFacetAndAddSelectors.addSelectors);
    const playerNewSelectors = getSighashes(playerFacetAndAddSelectors.addSelectors);

    let lootboxExistingFuncs = getSelectors(lootboxFacet);
    let tokensExistingFuncs = getSelectors(tokensFacet);
    let playerExistingFuncs = getSelectors(playerFacet);
    for (const selector of lootboxNewSelectors) {
        if (!lootboxExistingFuncs.includes(selector)) {
            const index = lootboxNewSelectors.findIndex((val) => val == selector);

            throw Error(
                `Selector ${ selector } (${ lootboxFacetAndAddSelectors.addSelectors[index] }) not found`
            );
        }
    }
    for (const selector of tokensNewSelectors) {
        if (!tokensExistingFuncs.includes(selector)) {
            const index = tokensNewSelectors.findIndex((val) => val == selector);

            throw Error(
                `Selector ${ selector } (${ tokensFacetAndAddSelectors.addSelectors[index] }) not found`
            );
        }
    }
    for (const selector of playerNewSelectors) {
        if (!playerExistingFuncs.includes(selector)) {
            const index = playerNewSelectors.findIndex((val) => val == selector);

            throw Error(
                `Selector ${ selector } (${ playerFacetAndAddSelectors.addSelectors[index] }) not found`
            );
        }
    }

    // Lootbox Facet
    const lootboxExistingSelectors =  getSelectors(lootboxFacet).filter(
        (selector) => !lootboxNewSelectors.includes(selector)
    );
    if (lootboxNewSelectors.length > 0) {
        cut.push({
            facetAddress: lootboxFacet.address,
            action: FacetCutAction.Add as Cut['action'],
            functionSelectors: lootboxNewSelectors,
        });
    }

    //Always replace the existing selectors to prevent duplications
    if (lootboxExistingSelectors.length > 0) {
        cut.push({
            facetAddress: lootboxFacet.address,
            action: FacetCutAction.Replace as Cut['action'],
            functionSelectors: lootboxExistingSelectors,
        });
    }

    // Tokens Facet
    const tokensExistingSelectors = getSelectors(tokensFacet).filter(
        (selector) => !tokensNewSelectors.includes(selector)
    );
    if (tokensNewSelectors.length > 0) {
        cut.push({
            facetAddress: tokensFacet.address,
            action: FacetCutAction.Add as Cut['action'],
            functionSelectors: tokensNewSelectors,
        });
    }

    //Always replace the existing selectors to prevent duplications
    if (tokensExistingSelectors.length > 0) {
        cut.push({
            facetAddress: tokensFacet.address,
            action: FacetCutAction.Replace as Cut['action'],
            functionSelectors: tokensExistingSelectors,
        });
    }

    // Player Facet
    const playerExistingSelectors = getSelectors(playerFacet).filter(
        (selector) => !playerNewSelectors.includes(selector)
    );
    if (playerNewSelectors.length > 0) {
        cut.push({
            facetAddress: playerFacet.address,
            action: FacetCutAction.Add as Cut['action'],
            functionSelectors: playerNewSelectors,
        });
    }

    //Always replace the existing selectors to prevent duplications
    if (playerExistingSelectors.length > 0) {
        cut.push({
            facetAddress: playerFacet.address,
            action: FacetCutAction.Replace as Cut['action'],
            functionSelectors: playerExistingSelectors,
        });
    }

    // Execute the Cut
    const diamondCut = new Contract(diamondAddress, DiamondCutFacet__factory.abi, account) as DiamondCutFacet;
    const diamondLoupe = new Contract(diamondAddress, DiamondLoupeFacet__factory.abi, account) as DiamondLoupeFacet;

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
}

export { upgradeDiamond };

interface Cut {
    facetAddress: string;
    action: 0 | 1 | 2;
    functionSelectors: string[];
}
