// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/LibAppStorage.sol";

contract PlayerFacet {
    AppStorage internal s;
    event LevelUpEvent(address player, uint16 level);

    function levelUp(address player) external {
        require(player != address(0), "Player address is not valid");
        //require(s.playersExists[player], "Player does not exist");
        //s.players[player].level++;
    }

    // for testing purposes
    function supportsInterface(bytes4 _interfaceID) external view returns (bool) {
        return false;
    }
}
