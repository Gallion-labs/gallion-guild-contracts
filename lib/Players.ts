import BasicFacetWrapper from "./BasicFacetWrapper";
import { PlayerFacet, PlayerFacet__factory } from "../typechain-types";

export default abstract class Players extends BasicFacetWrapper {
    private static readonly ABI = PlayerFacet__factory.abi;

    public static async add(contractAddress: string, playerAddress: string): Promise<void> {
        const contract = super.getContractFacet(contractAddress, this.ABI) as PlayerFacet;
        await contract.addPlayer(playerAddress);
    }
}
