import BasicFacetWrapper from "./BasicFacetWrapper";
import { LootboxFacet, LootboxFacet__factory } from "../typechain-types";
import { GasStation, GasStationData } from "../scripts/gasStation";

export default abstract class Lootboxes extends BasicFacetWrapper {
    private static readonly ABI = LootboxFacet__factory.abi;

    public static async open(contractAddress: string, playerAddress: string, lootboxId: number): Promise<void> {
        const contract = super.getContractFacet(contractAddress, this.ABI) as LootboxFacet;
        const gasStationData: GasStationData = await GasStation.getGasData();
        const tx = await contract.open(playerAddress, lootboxId, gasStationData);
        await tx.wait();
    }

    public static async list(contractAddress: string, playerAddress: string): Promise<LootboxesCount> {
        const contract = super.getContractFacet(contractAddress, this.ABI) as LootboxFacet;
        const lootboxes = await contract.list(playerAddress);
        if (lootboxes.length === 5) {
            return {
                Common: lootboxes[0].toNumber(),
                Rare: lootboxes[1].toNumber(),
                Epic: lootboxes[2].toNumber(),
                Legendary: lootboxes[3].toNumber(),
                Ethereal: lootboxes[4].toNumber(),
            };
        }
        return {
            Common: 0,
            Rare: 0,
            Epic: 0,
            Legendary: 0,
            Ethereal: 0,
        };
    }
}

export interface LootboxesCount {
    Common: number;
    Rare: number;
    Epic: number;
    Legendary: number;
    Ethereal: number;
}
