import Debug from 'debug';
import chalk from 'chalk';
import axios from 'axios';
import { BigNumber, ethers } from 'ethers';

const debug = Debug('gallion:contracts:gasStation');

export abstract class GasStation {
    private static readonly GasStationUrl = 'https://gasstation-mainnet.matic.network/v2';
    private static readonly DefaultGasData: GasData = {
        fast: {
            maxPriorityFee: 45,
            maxFee: 45
        }
    };

    public static async getGasData(): Promise<GasStationData> {
        try {
            const response = await axios.get<GasData>(this.GasStationUrl);
            if (response?.data?.fast?.maxPriorityFee) {
                return this.getGasStationData(response.data);
            } else {
                chalk.redBright(`Could not fetch gas data from ${ this.GasStationUrl } (malformed response)`);
                return this.getGasStationData(this.DefaultGasData);
            }
        } catch (e: any) {
            debug(
                chalk.redBright(`Could not fetch gas data from ${ this.GasStationUrl }: ${ e.toString() }`)
            );
            return this.getGasStationData(this.DefaultGasData);
        }
    }

    private static getGasStationData(gasData: GasData): GasStationData {
        return {
            maxFeePerGas: ethers.utils.parseUnits(
                Math.ceil(gasData.fast.maxFee).toString(),
                'gwei'
            ),
            maxPriorityFeePerGas: ethers.utils.parseUnits(
                Math.ceil(gasData.fast.maxPriorityFee).toString(),
                'gwei'
            )
        };
    }
}

interface GasData {
    fast: {
        maxPriorityFee: number;
        maxFee: number;
    };
}

export interface GasStationData {
    maxFeePerGas: BigNumber;
    maxPriorityFeePerGas: BigNumber;
}
