//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract TeamControl {
    mapping (address => bool) private team;

    modifier onlyTeam() {
        require(isTeamMember(msg.sender), "restricted to team members only");
        _;
    }

    constructor() {
        team[msg.sender] = true;
    }

    function isTeamMember(address account) public view returns (bool) {
        return team[account];
    }

    function addTeamMember(address account) external onlyTeam {
        _addTeamMember(account);
    }

    function removeTeamMember(address account) external onlyTeam {
        _removeTeamMember(account);
    }

    function _addTeamMember(address account) internal virtual {
        team[account] = true;
    }

    function _removeTeamMember(address account) internal virtual {
        team[account] = false;
    }
}
