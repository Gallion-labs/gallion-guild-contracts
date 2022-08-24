import { Network } from "@ethersproject/networks";
import { Contract, ContractInterface, ethers } from "ethers";
import { LootboxFacet, LootboxFacet__factory, PlayerFacet, PlayerFacet__factory } from "../typechain-types";
import { typeOf } from "uri-js/dist/esnext/util";

export default abstract class BasicFacetWrapper {
    private static readonly matic: Network = {
        name: 'matic',
        chainId: 137,
        _defaultProvider: (providers) => new providers.JsonRpcProvider('https://polygon-rpc.com')
    };
    private static readonly provider = ethers.getDefaultProvider(BasicFacetWrapper.matic);

    private static readonly account = new ethers.Wallet(
        process.env.ITEM_MANAGER as string,
        BasicFacetWrapper.provider
    );

    protected static getContractFacet(contractAddress: string, abi: ContractInterface): Contract {
        return new Contract(contractAddress, abi, BasicFacetWrapper.account);
    }
}
