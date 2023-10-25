// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol"; 

contract CoinCraft is ERC20 {
    uint constant _initial_supply = 10000000 * (10 ** 18); // 10.000.000 CC

    constructor() public ERC20("CoinCraft", "CC") {
        _mint(msg.sender, _initial_supply);
    }

    function claim1000Tokens() public {
        require(
            balanceOf(msg.sender) >= 1000 * (10 ** 18),
            "Insufficient balance to claim 1000 tokens"
        );

        _transfer(address(this), msg.sender, 1000 * (10 ** 18));
    }
}
