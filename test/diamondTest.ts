import { ethers } from 'hardhat';
import { Address } from '../types';
import { DiamondCutFacet, DiamondLoupeFacet, OwnershipFacet, PlayerFacet } from '../typechain-types';

const {
    getSelectors,
    FacetCutAction,
    removeSelectors,
    findAddressPositionInFacets
} = require('../scripts/libraries/diamond.ts')

const { deployDiamond } = require('../scripts/deploy.ts')

const { assert } = require('chai')

describe('GuildDiamondTest', async function () {
    let diamondAddress: Address;
    let diamondCutFacet: DiamondCutFacet;
    let diamondLoupeFacet: DiamondLoupeFacet;
    let ownershipFacet: OwnershipFacet;
    let tx;
    let receipt;
    let result;
    const addresses: Address[] = [];

    before(async function () {
        diamondAddress = await deployDiamond();
        diamondCutFacet = (await ethers.getContractAt('DiamondCutFacet', diamondAddress) as DiamondCutFacet);
        diamondLoupeFacet = (await ethers.getContractAt('DiamondLoupeFacet', diamondAddress) as DiamondLoupeFacet);
        ownershipFacet = (await ethers.getContractAt('OwnershipFacet', diamondAddress) as OwnershipFacet);
    });

    it('should have three facets -- call to facetAddresses function', async () => {
        for (const address of await diamondLoupeFacet.facetAddresses()) {
            addresses.push(address);
        }

        assert.equal(addresses.length, 3);
    });

    it('facets should have the right function selectors -- call to facetFunctionSelectors function', async () => {
        let selectors = getSelectors(diamondCutFacet);
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[0]);
        assert.sameMembers(result, selectors);
        selectors = getSelectors(diamondLoupeFacet);
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[1]);
        assert.sameMembers(result, selectors);
        selectors = getSelectors(ownershipFacet);
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[2]);
        assert.sameMembers(result, selectors);
    });

    it('selectors should be associated to facets correctly -- multiple calls to facetAddress function', async () => {
        assert.equal(
            addresses[0],
            await diamondLoupeFacet.facetAddress('0x1f931c1c')
        );
        assert.equal(
            addresses[1],
            await diamondLoupeFacet.facetAddress('0xcdffacc6')
        );
        assert.equal(
            addresses[1],
            await diamondLoupeFacet.facetAddress('0x01ffc9a7')
        );
        assert.equal(
            addresses[2],
            await diamondLoupeFacet.facetAddress('0xf2fde38b')
        );
    });

    it('should add levelUp functions', async () => {
        const PlayerFacet = await ethers.getContractFactory('PlayerFacet');
        const playerFacet = await PlayerFacet.deploy();
        await playerFacet.deployed();
        addresses.push(playerFacet.address);
        const selectors = getSelectors(playerFacet).remove(['supportsInterface(bytes4)']);
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: playerFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 });
        receipt = await tx.wait();
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${ tx.hash }`);
        }
        result = await diamondLoupeFacet.facetFunctionSelectors(playerFacet.address);
        assert.sameMembers(result, selectors);
    })

    it('should call levelUp function', async () => {
        const playerFacet: PlayerFacet = await ethers.getContractAt('PlayerFacet', diamondAddress);
        await playerFacet.levelUp('0x8F7d7E9Adfa6da73273391C57bab0eF22651c7Bb');
    })

    it('should replace supportsInterface function', async () => {
        const PlayerFacet = await ethers.getContractFactory('PlayerFacet');
        const selectors = getSelectors(PlayerFacet).get(['supportsInterface(bytes4)']);
        const testFacetAddress = addresses[3];
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: testFacetAddress,
                action: FacetCutAction.Replace,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 });
        receipt = await tx.wait();
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${ tx.hash }`);
        }
        result = await diamondLoupeFacet.facetFunctionSelectors(testFacetAddress);
        assert.sameMembers(result, getSelectors(PlayerFacet));
    })

    it('should add openLootbox function', async () => {
        const LootboxFacet = await ethers.getContractFactory('LootboxFacet');
        const lootboxFacet = await LootboxFacet.deploy();
        await lootboxFacet.deployed();
        addresses.push(lootboxFacet.address);
        const selectors = getSelectors(lootboxFacet);
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: lootboxFacet.address,
                action: FacetCutAction.Add,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 });
        receipt = await tx.wait();
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${ tx.hash }`);
        }
        result = await diamondLoupeFacet.facetFunctionSelectors(lootboxFacet.address);
        assert.sameMembers(result, selectors);
    })

    it('should remove openLootbox function', async () => {
        const lootboxFacet = await ethers.getContractAt('LootboxFacet', diamondAddress);
        const functionsToKeep: string[] = [];
        const selectors = getSelectors(lootboxFacet).remove(functionsToKeep);
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: ethers.constants.AddressZero,
                action: FacetCutAction.Remove,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 });
        receipt = await tx.wait();
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${ tx.hash }`);
        }
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[4]);
        assert.sameMembers(result, getSelectors(lootboxFacet).get(functionsToKeep));
    })

    /*it('should remove some test1 functions', async () => {
        const playerFacet = await ethers.getContractAt('PlayerFacet', diamondAddress)
        const functionsToKeep = ['test1Func2()', 'test1Func11()', 'test1Func12()']
        const selectors = getSelectors(playerFacet).remove(functionsToKeep)
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: ethers.constants.AddressZero,
                action: FacetCutAction.Remove,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${ tx.hash }`)
        }
        result = await diamondLoupeFacet.facetFunctionSelectors(addresses[3])
        assert.sameMembers(result, getSelectors(playerFacet).get(functionsToKeep))
    })*/

    it('remove all functions and facets accept \'diamondCut\' and \'facets\'', async () => {
        let selectors = []
        let facets = await diamondLoupeFacet.facets()
        for (let i = 0; i < facets.length; i++) {
            selectors.push(...facets[i].functionSelectors)
        }
        selectors = removeSelectors(selectors, ['facets()', 'diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)'])
        tx = await diamondCutFacet.diamondCut(
            [{
                facetAddress: ethers.constants.AddressZero,
                action: FacetCutAction.Remove,
                functionSelectors: selectors
            }],
            ethers.constants.AddressZero, '0x', { gasLimit: 800000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${ tx.hash }`)
        }
        facets = await diamondLoupeFacet.facets()
        assert.equal(facets.length, 2)
        assert.equal(facets[0][0], addresses[0])
        assert.sameMembers(facets[0][1], ['0x1f931c1c'])
        assert.equal(facets[1][0], addresses[1])
        assert.sameMembers(facets[1][1], ['0x7a0ed627'])
    })

    it('add most functions and facets', async () => {
        const diamondLoupeFacetSelectors = getSelectors(diamondLoupeFacet).remove(['supportsInterface(bytes4)'])
        const PlayerFacet = await ethers.getContractFactory('PlayerFacet')
        const LootboxFacet = await ethers.getContractFactory('LootboxFacet')
        // Any number of functions from any number of facets can be added/replaced/removed in a
        // single transaction
        const cut = [
            {
                facetAddress: addresses[1],
                action: FacetCutAction.Add,
                functionSelectors: diamondLoupeFacetSelectors.remove(['facets()'])
            },
            {
                facetAddress: addresses[2],
                action: FacetCutAction.Add,
                functionSelectors: getSelectors(ownershipFacet)
            },
            {
                facetAddress: addresses[3],
                action: FacetCutAction.Add,
                functionSelectors: getSelectors(PlayerFacet)
            },
            {
                facetAddress: addresses[4],
                action: FacetCutAction.Add,
                functionSelectors: getSelectors(LootboxFacet)
            }
        ]
        tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, '0x', { gasLimit: 8000000 })
        receipt = await tx.wait()
        if (!receipt.status) {
            throw Error(`Diamond upgrade failed: ${ tx.hash }`)
        }
        const facets = await diamondLoupeFacet.facets()
        const facetAddresses = await diamondLoupeFacet.facetAddresses()
        assert.equal(facetAddresses.length, 5)
        assert.equal(facets.length, 5)
        assert.sameMembers(facetAddresses, addresses)
        assert.equal(facets[0][0], facetAddresses[0], 'first facet')
        assert.equal(facets[1][0], facetAddresses[1], 'second facet')
        assert.equal(facets[2][0], facetAddresses[2], 'third facet')
        assert.equal(facets[3][0], facetAddresses[3], 'fourth facet')
        assert.equal(facets[4][0], facetAddresses[4], 'fifth facet')
        assert.sameMembers(facets[findAddressPositionInFacets(addresses[0], facets)][1], getSelectors(diamondCutFacet))
        assert.sameMembers(facets[findAddressPositionInFacets(addresses[1], facets)][1], diamondLoupeFacetSelectors)
        assert.sameMembers(facets[findAddressPositionInFacets(addresses[2], facets)][1], getSelectors(ownershipFacet))
        assert.sameMembers(facets[findAddressPositionInFacets(addresses[3], facets)][1], getSelectors(PlayerFacet))
        assert.sameMembers(facets[findAddressPositionInFacets(addresses[4], facets)][1], getSelectors(LootboxFacet))
    })
})
