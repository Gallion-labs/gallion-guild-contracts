import BasicFacetWrapper from './BasicFacetWrapper';
import { PlayerFacet, PlayerFacet__factory } from '../typechain-types';
import { GasStation, GasStationData } from '../scripts/gasStation';

export abstract class Players extends BasicFacetWrapper {
    private static readonly ABI = PlayerFacet__factory.abi;

    public static async getBalances(contractAddress: string, playerAddress: string): Promise<PlayerBalances> {
        const contract = super.getContractFacet(contractAddress, this.ABI) as PlayerFacet;
        const playerStats: PlayerFacet.PlayerInfoStructOutput = await contract.player(playerAddress);
        return {
            guildTokens: playerStats.balances[0].toNumber(),
            commonLootboxes: playerStats.balances[1].toNumber(),
            rareLootboxes: playerStats.balances[2].toNumber(),
            epicLootboxes: playerStats.balances[3].toNumber(),
            legendaryLootboxes: playerStats.balances[4].toNumber(),
            etherealLootboxes: playerStats.balances[5].toNumber()
        };
    }

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

export interface PlayerBalances {
    guildTokens: number;
    commonLootboxes: number;
    rareLootboxes: number;
    epicLootboxes: number;
    legendaryLootboxes: number;
    etherealLootboxes: number;
}
