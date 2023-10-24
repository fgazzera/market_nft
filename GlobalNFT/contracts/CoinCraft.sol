// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CoinCraft is ERC20 {

    uint8 private _decimals = 6;
    uint256 private _supply = 100000000000; // 100.000.000.000

    string _name = "CoinCraft";
    string _symbol = "CC";

    constructor() ERC20(_name, _symbol) {
        _mint(msg.sender, _supply * 10 ** uint(decimals()));
    }

    function decimals()public override view returns(uint8){
        return _decimals;
    }
}