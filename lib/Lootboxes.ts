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
}
