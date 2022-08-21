// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {AppStorage} from "./LibAppStorage.sol";
import {LibDiamond} from "./LibDiamond.sol";
import {LibMeta} from "./LibMeta.sol";

contract Modifiers {
    AppStorage internal s;

    modifier onlyGuildAdmin() {
        require(s.guildAdmins[LibMeta.msgSender()].createdAt > 0, "NOT_ALLOWED: Only guild admins can call this function");
        _;
    }

    modifier playerExists(address player) {
        require(player != address(0), "NOT_ALLOWED: Player address is not valid");
        require(s.players[player].createdAt > 0, "NOT_ALLOWED: Player does not exist");
        _;
    }

    modifier playerNotExists(address player) {
        require(player != address(0), "NOT_ALLOWED: Player address is not valid");
        require(!(s.players[player].createdAt > 0), "NOT_ALLOWED: Player already exists");
        _;
    }

    modifier onlyOwner() {
        LibDiamond.enforceIsContractOwner();
        _;
    }

    modifier onlyGuildAdminOrGallion() {
        require(s.guildAdmins[LibMeta.msgSender()].createdAt > 0 || LibMeta.msgSender() == s.gallionLabs, "NOT_ALLOWED: Only Gallion can call this function");
        _;
    }

    modifier onlyGallion() {
        require(LibMeta.msgSender() == s.gallionLabs, "NOT_ALLOWED: Only Gallion can call this function");
        _;
    }

    modifier protectedCall() {
        LibDiamond.enforceIsContractOwner();
        require(LibMeta.msgSender() == address(this),
            "NOT_ALLOWED: Only Owner or this contract can call this function");
        _;
    }

    modifier noReentrant() {
        require(!s.locked, "No re-entrancy");
        s.locked = true;
        _;
        s.locked = false;
    }
}
