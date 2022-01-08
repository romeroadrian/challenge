//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./TeamControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ETHPoolWithToken is ERC20, TeamControl {
    event RewardsAdded(address indexed account, uint256 amount);
    event Deposited(address indexed account, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    constructor() ERC20("ETHPool Share", "EPS") {
    }

    function deposit() external payable {
        require(msg.value > 0, "send some eth ser");

        uint256 shares;

        if (totalSupply() == 0) {
            shares = msg.value;
        } else {
            shares = msg.value * totalSupply() / (address(this).balance - msg.value);
        }

        _mint(msg.sender, shares);

        emit Deposited(msg.sender, msg.value);
    }

    function withdraw() external {
        uint256 shares = balanceOf(msg.sender);
        require(shares > 0, "you didnt send any eth ser");

        uint256 value = address(this).balance * shares / totalSupply();

        _burn(msg.sender, shares);

        (bool sent,) = msg.sender.call{value: value}("");
        require(sent, "failed to send eth");

        emit Withdrawn(msg.sender, value);
    }

    receive() external payable onlyTeam() {
        require(totalSupply() > 0, "cant deposit rewards if there are no deposits");

        emit RewardsAdded(msg.sender, msg.value);
    }
}
