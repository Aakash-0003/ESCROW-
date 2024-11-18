//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract Escrow {
    address public immutable owner;
    enum Status {
        blackListed,
        whiteListed
    }
    mapping(address => Status) public isWhitelist;
    address[] public members;
    mapping(address => uint256) private balances;

    // Events
    event MemberWhitelisted(address indexed member);
    event MemberBlacklisted(address indexed member);
    event FundsDeposited(uint256 totalAmount, uint256 allocatedPerMember);
    event FundsDepositedToMember(address member, uint256 amount);
    event FundsWithdrawn(address indexed member, uint256 amount);

    //modifier
    //owner
    modifier onlyOwner() {
        require(msg.sender == owner, "NOT AUTHORIZED");
        _;
    }
    modifier onlyWhitelisted(address _member) {
        require(isWhitelist[_member] == Status.whiteListed, "whitelisted");
        _;
    }

    //constructor
    constructor(address _owner) {
        owner = _owner;
        balances[owner] = 0;
    }

    //set whitelist
    function setWhitelist(address _member) external onlyOwner {
        isWhitelist[_member] = Status.whiteListed;
        members.push(_member);
        emit MemberWhitelisted(_member);
    }

    // Blacklist a member
    function blacklistMember(
        address _member
    ) external onlyOwner onlyWhitelisted(_member) {
        isWhitelist[_member] = Status.blackListed;
        uint256 balance = balances[_member];
        balances[_member] = 0;
        balances[owner] += balance;

        for (uint256 i = 0; i < members.length; i++) {
            if (members[i] == _member) {
                members[i] = members[members.length - 1];
                members.pop();
                break;
            }
        }

        emit MemberBlacklisted(_member);
    }

    //depositEqually
    function depositEqually() external payable onlyOwner {
        require(msg.value > 0, "No funds");
        require(members.length > 0, "No whitelisted members");

        uint256 amount = msg.value / members.length;

        for (uint256 i = 0; i < members.length; i++) {
            if (isWhitelist[members[i]] == Status.whiteListed) {
                balances[members[i]] += amount;
            }
        }

        emit FundsDeposited(msg.value, amount);
    }

    //custom-depositToMember
    function depositToMembers(
        address _member
    ) external payable onlyOwner onlyWhitelisted(_member) {
        require(msg.value >= 0, "Insufficient funds");

        for (uint256 i = 0; i < members.length; i++) {
            if (isWhitelist[members[i]] == Status.whiteListed) {
                balances[members[i]] += msg.value;
            }
        }
        emit FundsDepositedToMember(_member, msg.value);
    }

    //Withdraw function for whitelisted members
    function withdrawFunds(
        uint256 _amount
    ) external onlyWhitelisted(msg.sender) {
        uint256 balance = balances[msg.sender];
        require(balance >= _amount, "Insufficient funds");

        balances[msg.sender] -= _amount;
        payable(msg.sender).transfer(_amount);

        emit FundsWithdrawn(msg.sender, _amount);
    }

    //Status of Beneficiary
    function status(address _member) external view returns (Status) {
        return isWhitelist[_member];
    }

    function balanceOf(
        address _account
    ) external view returns (uint256 amount) {
        amount = balances[_account];
    }
}
