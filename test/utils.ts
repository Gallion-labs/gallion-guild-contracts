import chalk from 'chalk';
import { Signer } from "@ethersproject/abstract-signer";
import { Contract } from "@ethersproject/contracts";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DiamondLoupeFacet, OwnershipFacet } from "../typechain-types";
import { ethers } from 'ethers';

export function logTokensWon(accountName: string, tokenName: string, amount: number) {
    setTimeout(() => {
        console.log(chalk.grey(`      ${ accountName } got ${ chalk.greenBright(`${ amount } ${ tokenName }`) }`));
    });
}

export function convertFacetAndSelectorsToString(
    facets: FacetsAndAddSelectors[]
): string {
    let outputString = "";

    facets.forEach((facet) => {
        outputString = outputString.concat(
            `#${facet.facetName}$$$${facet.addSelectors.join(
                "*"
            )}$$$${facet.removeSelectors.join("*")}`
        );
    });

    return outputString;
}

export function getSighashes(selectors: string[]): string[] {
    if (selectors.length === 0) return [];
    const sighashes: string[] = [];
    selectors.forEach((selector) => {
        if (selector !== "") sighashes.push(getSelector(selector));
    });
    return sighashes;
}

export function getSelectors(contract: Contract) {
    const signatures = Object.keys(contract.interface.functions);
    const selectors = signatures.reduce((acc: string[], val: string) => {
        if (val !== "init(bytes)") {
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
    return await (await ethers.getContractAt("OwnershipFacet", address)).owner();
}

export async function getDiamondSigner(hre: HardhatRuntimeEnvironment, diamondAddress: string, override?: string) {
    //Instantiate the Signer
    let signer: Signer;
    const owner = await (
        (await hre.ethers.getContractAt(
            "OwnershipFacet",
            diamondAddress
        )) as OwnershipFacet
    ).owner();
    const testing = ["hardhat", "localhost"].includes(hre.network.name);

    if (testing) {
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [override ? override : owner],
        });
        return await hre.ethers.getSigner(override ? override : owner);
    } else if (hre.network.name === "matic") {
        return (await hre.ethers.getSigners())[0];
    } else {
        throw Error("Incorrect network selected");
    }
}

export interface FacetsAndAddSelectors {
    facetName: string;
    addSelectors: string[];
    removeSelectors: string[];
}

export interface rfRankingScore {
    rfType: string;
    gotchiId: string;
    score: number;
}
