// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {AppStorage} from "../libraries/LibAppStorage.sol";
import {Modifiers} from "../libraries/Modifiers.sol";

contract TreasuryFacet is Modifiers {

    /// @notice Returns the current reward ratio from all income
    /// @return _rewardRatio The reward ratio
    function getRewardRatioFromIncome() public view returns (uint _rewardRatio) {
        _rewardRatio = s.rewardRatioFromIncome;
    }

    /// @notice Sets the reward ratio from all income
    /// @param _rewardRatioFromIncome The reward ratio (0-100)
    function setRewardRatioFromIncome(uint8 _rewardRatioFromIncome) external onlyGuildAdmin {
        require(_rewardRatioFromIncome >= 0 && _rewardRatioFromIncome <= 100, "Invalid reward ratio, must be between 0 and 100");
        s.rewardRatioFromIncome = _rewardRatioFromIncome;
    }
}
