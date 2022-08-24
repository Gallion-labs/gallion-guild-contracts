// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.13;

import {Context} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AppStorage} from "../libraries/LibAppStorage.sol";
import {Modifiers} from "../libraries/Modifiers.sol";
import "../libraries/LibTokens.sol";

// Contains ERC1155 specific functions
contract TokensFacet is Modifiers, Context {
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    function balanceOf(address account, uint256 id) public view virtual returns (uint256) {
        require(account != address(0), "ERC1155: address zero is not a valid owner");
        return LibTokens.balanceOf(account, id);
    }

    function uri() public view virtual returns (string memory) {
        return s.uri;
    }

    function setUri(string memory _uri) public onlyGallion {
        s.uri = _uri;
    }

    function balanceOfBatch(address[] memory accounts, uint256[] memory ids)
    public
    view
    virtual
    returns (uint256[] memory)
    {
        require(accounts.length == ids.length, "ERC1155: accounts and ids length mismatch");
        return LibTokens.balanceOfBatch(accounts, ids);
    }

    function setApprovalForAll(address operator, bool approved) public virtual {
        _setApprovalForAll(_msgSender(), operator, approved);
    }

    function isApprovedForAll(address account, address operator) public view virtual returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );
        _safeTransferFrom(from, to, id, amount, data);
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not token owner nor approved"
        );
        _safeBatchTransferFrom(from, to, ids, amounts, data);
    }

    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal virtual {
        AppStorage storage s = LibDiamond.appStorage();
        require(to != address(0), "ERC1155: transfer to the zero address");

        address operator = _msgSender();
        uint256[] memory ids = LibTokens._asSingletonArray(id);
        uint256[] memory amounts = LibTokens._asSingletonArray(amount);

        LibTokens._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        uint256 fromBalance = s._balances[id][from];
        require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
        unchecked {
            s._balances[id][from] = fromBalance - amount;
        }
        s._balances[id][to] += amount;

        emit LibTokens.TransferSingle(operator, from, to, id, amount);

        LibTokens._afterTokenTransfer(from, amounts);
    }

    function _safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual {
        AppStorage storage s = LibDiamond.appStorage();
        require(ids.length == amounts.length, "ERC1155: ids and amounts length mismatch");
        require(to != address(0), "ERC1155: transfer to the zero address");

        address operator = _msgSender();

        LibTokens._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];

            uint256 fromBalance = s._balances[id][from];
            require(fromBalance >= amount, "ERC1155: insufficient balance for transfer");
            unchecked {
                s._balances[id][from] = fromBalance - amount;
            }
            s._balances[id][to] += amount;
        }

        emit LibTokens.TransferBatch(operator, from, to, ids, amounts);

        LibTokens._afterTokenTransfer(from, amounts);
    }

    function _setApprovalForAll(
        address owner,
        address operator,
        bool approved
    ) internal virtual {
        require(owner != operator, "ERC1155: setting approval status for self");
        _operatorApprovals[owner][operator] = approved;
        emit LibTokens.ApprovalForAll(owner, operator, approved);
    }
}
