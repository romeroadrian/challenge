//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../TeamControl.sol";

contract TeamControlMock is TeamControl {
    bool public modified;

    constructor() {
        modified = false;
    }

    function modify() external onlyTeam {
        modified = true;
    }
}
