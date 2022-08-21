// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import {AppStorage, Player, Rarity} from "./LibAppStorage.sol";
import {LibDiamond} from "./LibDiamond.sol";
import {LibUtils} from "./Utils.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";


library LibTokens {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256[] ids,
        uint256[] values
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    function balanceOf(address account, uint256 id) internal view returns (uint256) {
        AppStorage storage s = LibDiamond.appStorage();
        return s._balances[id][account];
    }

    function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
    internal
    view
    returns (uint256[] memory)
    {
        uint256[] memory batchBalances = new uint256[](accounts.length);

        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }

        return batchBalances;
    }

    function mint(
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal {
        AppStorage storage s = LibDiamond.appStorage();
        require(to != address(0), "ERC1155: mint to the zero address");

        address operator = _msgSender();
        uint256[] memory ids = _asSingletonArray(id);
        uint256[] memory amounts = _asSingletonArray(amount);

        _beforeTokenTransfer(operator, address(0), to, ids, amounts, data);

        s._balances[id][to] += amount;
        emit TransferSingle(operator, address(0), to, id, amount);

        _afterTokenTransfer(address(0), amounts);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {
        AppStorage storage s = LibDiamond.appStorage();
        require(to != address(0), "ERC1155: mint to the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, address(0), to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; i++) {
            s._balances[ids[i]][to] += amounts[i];
        }

        emit TransferBatch(operator, address(0), to, ids, amounts);

        _afterTokenTransfer(address(0), amounts);
    }

    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) internal {
        AppStorage storage s = LibDiamond.appStorage();
        require(from != address(0), "ERC1155: burn from the zero address");

        address operator = _msgSender();
        uint256[] memory ids = _asSingletonArray(id);
        uint256[] memory amounts = _asSingletonArray(amount);

        _beforeTokenTransfer(operator, from, address(0), ids, amounts, "");

        uint256 fromBalance = s._balances[id][from];
        require(fromBalance >= amount, "ERC1155: burn amount exceeds balance");
    unchecked {
        s._balances[id][from] = fromBalance - amount;
    }

        emit TransferSingle(operator, from, address(0), id, amount);

        _afterTokenTransfer(from, amounts);
    }

    function burnBatch(
        address from,
        uint256[] memory ids,
        uint256[] memory amounts
    ) internal {
        AppStorage storage s = LibDiamond.appStorage();
        require(from != address(0), "ERC1155: burn from the zero address");
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");

        address operator = _msgSender();

        _beforeTokenTransfer(operator, from, address(0), ids, amounts, "");

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 fromBalance = s._balances[id][from];
            require(fromBalance >= amount, "ERC1155: burn amount exceeds balance");
        unchecked {
            s._balances[id][from] = fromBalance - amount;
        }
        }

        emit TransferBatch(operator, from, address(0), ids, amounts);

        _afterTokenTransfer(from, amounts);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {}

    function _afterTokenTransfer(
        address from,
        uint256[] memory amounts
    ) internal {
        if (from == address(0)) {
            AppStorage storage s = LibDiamond.appStorage();
            s.totalMintedLoootboxes += amounts.length;
        }
    }

    function _asSingletonArray(uint256 element) internal pure returns (uint256[] memory) {
        uint256[] memory array = new uint256[](1);
        array[0] = element;

        return array;
    }

    function _msgSender() internal view returns (address) {
        return msg.sender;
    }

    function _msgData() internal pure returns (bytes calldata) {
        return msg.data;
    }
}
