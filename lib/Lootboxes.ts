import { LootboxFacet } from "../typechain-types/facets";
import BasicFacetWrapper from "./BasicFacetWrapper";
import { LootboxFacet__factory, PlayerFacet__factory } from "../typechain-types";

export default abstract class Lootboxes extends BasicFacetWrapper {
    private static readonly ABI = LootboxFacet__factory.abi;

    public static async open(contractAddress: string, playerAddress: string, lootboxId: number): Promise<void> {
        const contract = super.getContractFacet(contractAddress, this.ABI) as LootboxFacet;
        await contract.openLootbox(playerAddress, lootboxId);
    }
}
