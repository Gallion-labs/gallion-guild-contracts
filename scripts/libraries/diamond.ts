/* global ethers */

import { Contract } from 'ethers';
import { ethers } from 'hardhat';
import { Address } from '../../types';
import { IDiamondLoupe } from '../../typechain-types/facets/DiamondLoupeFacet';
import FacetStruct = IDiamondLoupe.FacetStruct;

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

class Selectors extends Array<string> {
    public contract: Contract;

    public constructor(contract: Contract, ...selectors: string[]) {
        super(...selectors);
        this.contract = contract;
    }

    /**
     * Used with getSelectors to remove selectors from an array of selectors.
     * @param functionNames - an array of function signatures
     */
    public remove = (functionNames: string[]): Selectors => {
        const _signatures = this.filter((v) => {
            for (const functionName of functionNames) {
                if (v === this.contract.interface.getSighash(functionName)) {
                    return false;
                }
            }
            return true;
        }) as Selectors;

        return new Selectors(this.contract, ..._signatures);
    }

    /**
     * Used with getSelectors to get selectors from an array of selectors.
     * @param functionNames - an array of function signatures
     */
    public get = (functionNames: string[]): Selectors => {
        const _signatures = this.filter((v) => {
            for (const functionName of functionNames) {
                if (v === this.contract.interface.getSighash(functionName)) {
                    return true;
                }
            }
            return false;
        });

        return new Selectors(this.contract, ..._signatures);
    }
}

// get function selectors from ABI
export function getSelectors(contract: Contract): Selectors {
    const signatures = Object.keys(contract.interface.functions);
    const _signatures = signatures.reduce((acc: string[], val) => {
        if (val !== 'init(bytes)') {
            acc.push(contract.interface.getSighash(val));
        }
        return acc;
    }, []);

    return new Selectors(contract, ..._signatures);
}

// get function selector from function signature
export function getSelector(func: string): string {
    const abiInterface = new ethers.utils.Interface([func]);
    return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

// remove selectors using an array of signatures
export function removeSelectors(selectors: Selectors, signatures: string[]): Selectors {
    const _interface = new ethers.utils.Interface(signatures.map(v => 'function ' + v));
    const _signatures = signatures.map(v => _interface.getSighash(v));
    return selectors.filter(v => !_signatures.includes(v)) as Selectors;
}

// find a particular address position in the return value of diamondLoupeFacet.facets()
export function findAddressPositionInFacets(facetAddress: Address, facets: FacetStruct[]): number | undefined {
    for (let i = 0; i < facets.length; i++) {
        if (facets[i].facetAddress === facetAddress) {
            return i;
        }
    }
    return;
}
