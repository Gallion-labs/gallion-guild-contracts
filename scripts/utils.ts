import chalk from 'chalk';
import { Contract } from '@ethersproject/contracts';
import { OwnershipFacet } from '../typechain-types';
import { ethers } from 'ethers';

export function logTokensWon(accountName: string, tokenName: string, amount: number) {
    setTimeout(() => {
        console.log(chalk.grey(`      ${ accountName } got ${ chalk.greenBright(`${ amount } ${ tokenName }`) }`));
    });
}

export function getSighashes(selectors: string[]): string[] {
    if (selectors.length === 0) return [];
    const sighashes: string[] = [];
    selectors.forEach((selector) => {
        if (selector !== '') sighashes.push(getSelector(selector));
    });
    return sighashes;
}

export function getSelectors(contract: Contract) {
    const signatures = Object.keys(contract.interface.functions);
    const selectors = signatures.reduce((acc: string[], val: string) => {
        if (val !== 'init(bytes)') {
            acc.push(contract.interface.getSighash(val));
        }
        return acc;
    }, []);
    return selectors;
}

export function getSelector(func: string) {
    const abiInterface = new ethers.utils.Interface([func]);
    return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

export async function diamondOwner(address: string, ethers: any) {
    return await (await ethers.getContractAt('OwnershipFacet', address)).owner();
}

export interface FacetAndAddSelectors {
    facetName: string;
    addSelectors: string[];
    removeSelectors: string[];
}

export interface rfRankingScore {
    rfType: string;
    gotchiId: string;
    score: number;
}
