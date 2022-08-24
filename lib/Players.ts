import BasicFacetWrapper from "./BasicFacetWrapper";
import { PlayerFacet, PlayerFacet__factory } from "../typechain-types";
import { GasStation, GasStationData } from "../scripts/gasStation";

export default abstract class Players extends BasicFacetWrapper {
    private static readonly ABI = PlayerFacet__factory.abi;

    public static async add(contractAddress: string, playerAddress: string): Promise<void> {
        const contract = super.getContractFacet(contractAddress, this.ABI) as PlayerFacet;
        const gasStationData: GasStationData = await GasStation.getGasData();
        const tx = await contract.addPlayer(playerAddress, gasStationData);
        await tx.wait();
    }

    public static async levelUp(contractAddress: string, playerAddress: string): Promise<void> {
        const contract = super.getContractFacet(contractAddress, this.ABI) as PlayerFacet;
        const gasStationData: GasStationData = await GasStation.getGasData();
        const tx = await contract.levelUp(playerAddress, gasStationData);
        await tx.wait();
    }
}
