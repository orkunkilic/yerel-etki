pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MatchingFund is Ownable {
    //  No donations after payout
    bool public fundClosed;

    event Payout(address payoutCtc, uint256 amount);
    event Donation(address donator, uint256 amount);

    constructor() {

    }

    function donate() public payable {
        require(!fundClosed, "Pool already paid out!");
        emit Donation(msg.sender, msg.value);
    }

    function closeFund() public onlyOwner {
        fundClosed = true;
    }

    function payout(address payable _payoutAddr) public  payable onlyOwner {
        require(fundClosed, "Fund is still open for donations");
        
        _payoutAddr.transfer(address(this).balance);
        
        emit Payout(_payoutAddr, address(this).balance);
    }
}