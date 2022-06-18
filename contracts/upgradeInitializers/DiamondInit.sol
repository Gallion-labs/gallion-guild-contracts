// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IDiamondLoupe} from "../interfaces/IDiamondLoupe.sol";
import {IDiamondCut} from "../interfaces/IDiamondCut.sol";
import {IERC173} from "../interfaces/IERC173.sol";
import {IERC165} from "../interfaces/IERC165.sol";
import {AppStorage, Admin} from "../libraries/LibAppStorage.sol";
import {LibMeta} from "../libraries/LibMeta.sol";

contract DiamondInit {
    AppStorage internal s;

    struct Args {
        address gallionLabs;
        address[] guildAdmins;
    }

    function init(Args memory _args) external {
        s.gallionLabs = _args.gallionLabs;

        for(uint i = 0; i < _args.guildAdmins.length; i++) {
            s.guildAdmins[_args.guildAdmins[i]] = Admin(block.timestamp);
        }

        s.domainSeparator = LibMeta.domainSeparator("GallionDiamond", "V1");

        // adding ERC165 data
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        ds.supportedInterfaces[type(IERC165).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondCut).interfaceId] = true;
        ds.supportedInterfaces[type(IDiamondLoupe).interfaceId] = true;
        ds.supportedInterfaces[type(IERC173).interfaceId] = true;
    }
}
