import { FacetCutAction, getSelectors } from './libraries/diamond';
import { Contract, ContractReceipt, ContractTransaction, ethers } from 'ethers';
import Debug from 'debug';
import chalk from 'chalk';
import RulesFacetArtifact from '../artifacts/contracts/facets/RulesFacet.sol/RulesFacet.json';
import TreasuryFacetArtifact from '../artifacts/contracts/facets/TreasuryFacet.sol/TreasuryFacet.json';
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

    const rulesFacetAndAddSelectors: FacetAndAddSelectors = {
        facetName: 'RulesFacet',
        addSelectors: ['function getLootboxesInfo() public view returns (LootboxInfo[] memory _lootboxesInfo)'],
        removeSelectors: []
    };

    const treasuryFacetAndAddSelectors: FacetAndAddSelectors = {
        facetName: 'TreasuryFacet',
        addSelectors: ['function getRewardRatioFromIncome() public view returns (uint _rewardRatio)'],
        removeSelectors: [],
    };

    // Create the cut
    const cut: Cut[] = [];

    // Deploy Facets
    const RulesFacet = await new ethers.ContractFactory(RulesFacetArtifact.abi, RulesFacetArtifact.bytecode, account);
    const rulesFacet = await RulesFacet.deploy(gasStationData);
    await rulesFacet.deployed();
    debug(chalk.grey(`RulesFacet deployed: ${ chalk.greenBright(rulesFacet.address) }`));
    const TreasuryFacet = await new ethers.ContractFactory(TreasuryFacetArtifact.abi, TreasuryFacetArtifact.bytecode, account);
    const treasuryFacet = await TreasuryFacet.deploy(gasStationData);
    await treasuryFacet.deployed();
    debug(chalk.grey(`TreasuryFacet deployed: ${ chalk.greenBright(treasuryFacet.address) }`));
    const rulesNewSelectors = getSighashes(rulesFacetAndAddSelectors.addSelectors);
    const treasuryNewSelectors = getSighashes(treasuryFacetAndAddSelectors.addSelectors);

    // Execute the Cut
    const diamondCut = await new Contract(diamondAddress, DiamondCutFacet__factory.abi, account) as DiamondCutFacet;
    const diamondLoupe = await new Contract(diamondAddress, DiamondLoupeFacet__factory.abi, account) as DiamondLoupeFacet;

    const tx: ContractTransaction = await diamondCut.diamondCut(
        [
            {
                facetAddress: rulesFacet.address,
                action: FacetCutAction.Replace as Cut['action'],
                functionSelectors: getSelectors(rulesFacet).filter(
                    (selector) => !rulesNewSelectors.includes(selector)
                )
            },
            {
                facetAddress: treasuryFacet.address,
                action: FacetCutAction.Replace as Cut['action'],
                functionSelectors: getSelectors(treasuryFacet).filter(
                    (selector) => !treasuryNewSelectors.includes(selector)
                )
            }
        ],
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
