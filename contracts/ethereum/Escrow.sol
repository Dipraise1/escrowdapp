// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Enhanced Escrow Contract
 * @dev A secure escrow contract with multi-party approval, timelock, and dispute mechanisms
 * @author CryptoEscrow
 */
contract Escrow {
    // Main actors in the escrow
    address public arbiter;
    address public beneficiary;
    address public depositor;
    
    // Contract details
    string public terms;
    uint256 public amount;
    uint256 public creationTime;
    uint256 public timelock;
    
    // Contract state
    bool public isApproved;
    bool public isCancelled;
    bool public isDisputed;
    
    // Optional features
    bool public hasTimelock;
    bool public hasMilestones;
    
    // Dispute handling
    string public disputeReason;
    
    // Milestone tracking (optional)
    struct Milestone {
        string description;
        uint256 amount;
        bool isCompleted;
    }
    
    Milestone[] public milestones;
    uint256 public currentMilestone;
    
    // Modifiers
    modifier onlyDepositor() {
        require(msg.sender == depositor, "Only depositor can call this function");
        _;
    }
    
    modifier onlyArbiter() {
        require(msg.sender == arbiter, "Only arbiter can call this function");
        _;
    }
    
    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Only beneficiary can call this function");
        _;
    }
    
    modifier notDisputed() {
        require(!isDisputed, "Contract is currently in dispute");
        _;
    }
    
    modifier notApproved() {
        require(!isApproved, "Contract has already been approved");
        _;
    }
    
    modifier notCancelled() {
        require(!isCancelled, "Contract has already been cancelled");
        _;
    }
    
    // Events
    event Deposited(address indexed from, uint256 amount);
    event Approved(uint256 amount);
    event Cancelled(uint256 amount);
    event MilestoneCompleted(uint256 indexed milestoneIndex, uint256 amount);
    event DisputeRaised(address indexed by, string reason);
    event DisputeResolved(address indexed resolvedBy, bool approved);
    event TimelockExtended(uint256 newTimelock);
    event MilestoneAdded(string description, uint256 amount);
    
    /**
     * @dev Constructor to create a new escrow contract
     * @param _arbiter The address of the arbiter who will resolve disputes
     * @param _beneficiary The address of the beneficiary who will receive the funds
     * @param _terms Text description of the terms of the escrow
     * @param _timelock Optional timelock in seconds (0 for no timelock)
     */
    constructor(
        address _arbiter, 
        address _beneficiary, 
        string memory _terms,
        uint256 _timelock
    ) payable {
        require(_arbiter != address(0), "Arbiter cannot be zero address");
        require(_beneficiary != address(0), "Beneficiary cannot be zero address");
        require(bytes(_terms).length > 0, "Terms cannot be empty");
        
        arbiter = _arbiter;
        beneficiary = _beneficiary;
        depositor = msg.sender;
        terms = _terms;
        amount = msg.value;
        creationTime = block.timestamp;
        
        // Set timelock if provided
        if (_timelock > 0) {
            timelock = block.timestamp + _timelock;
            hasTimelock = true;
        }
        
        if (msg.value > 0) {
            emit Deposited(msg.sender, msg.value);
        }
    }
    
    /**
     * @dev Add additional funds to the escrow
     */
    function deposit() external payable onlyDepositor notApproved notCancelled {
        amount += msg.value;
        emit Deposited(msg.sender, msg.value);
    }
    
    /**
     * @dev Arbiter approves the escrow and releases funds to the beneficiary
     */
    function approve() external onlyArbiter notApproved notCancelled {
        isApproved = true;
        
        (bool sent, ) = beneficiary.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
        
        emit Approved(amount);
    }
    
    /**
     * @dev Depositor cancels the escrow and withdraws funds
     * Only possible if the timelock hasn't expired or there's no timelock
     */
    function cancel() external onlyDepositor notApproved notCancelled {
        if (hasTimelock) {
            require(block.timestamp < timelock, "Timelock has expired, cannot cancel");
        }
        
        isCancelled = true;
        
        (bool sent, ) = depositor.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
        
        emit Cancelled(amount);
    }
    
    /**
     * @dev Add a milestone to the escrow
     * @param _description Description of the milestone
     * @param _amount Amount allocated to this milestone (in wei)
     */
    function addMilestone(string memory _description, uint256 _amount) external onlyDepositor notApproved notCancelled {
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_amount > 0, "Amount must be greater than 0");
        
        // First milestone - enable milestone tracking
        if (!hasMilestones) {
            hasMilestones = true;
            currentMilestone = 0;
        }
        
        milestones.push(Milestone({
            description: _description,
            amount: _amount,
            isCompleted: false
        }));
        
        emit MilestoneAdded(_description, _amount);
    }
    
    /**
     * @dev Complete a milestone and release the associated funds
     * @param _milestoneIndex Index of the milestone to complete
     */
    function completeMilestone(uint256 _milestoneIndex) external onlyArbiter notApproved notCancelled {
        require(hasMilestones, "No milestones defined");
        require(_milestoneIndex < milestones.length, "Invalid milestone index");
        require(!milestones[_milestoneIndex].isCompleted, "Milestone already completed");
        
        Milestone storage milestone = milestones[_milestoneIndex];
        milestone.isCompleted = true;
        
        uint256 paymentAmount = milestone.amount;
        require(address(this).balance >= paymentAmount, "Insufficient balance for milestone");
        
        (bool sent, ) = beneficiary.call{value: paymentAmount}("");
        require(sent, "Failed to send Ether");
        
        currentMilestone = _milestoneIndex + 1;
        
        emit MilestoneCompleted(_milestoneIndex, paymentAmount);
    }
    
    /**
     * @dev Either party can raise a dispute
     * @param _reason Reason for the dispute
     */
    function raiseDispute(string memory _reason) external notApproved notCancelled {
        require(msg.sender == depositor || msg.sender == beneficiary, "Only depositor or beneficiary can raise dispute");
        require(bytes(_reason).length > 0, "Reason cannot be empty");
        
        isDisputed = true;
        disputeReason = _reason;
        
        emit DisputeRaised(msg.sender, _reason);
    }
    
    /**
     * @dev Arbiter resolves a dispute
     * @param _approved True to approve escrow, false to return funds to depositor
     */
    function resolveDispute(bool _approved) external onlyArbiter notApproved notCancelled {
        require(isDisputed, "No dispute to resolve");
        
        isDisputed = false;
        
        if (_approved) {
            isApproved = true;
            
            (bool sent, ) = beneficiary.call{value: address(this).balance}("");
            require(sent, "Failed to send Ether");
            
            emit Approved(address(this).balance);
        } else {
            isCancelled = true;
            
            (bool sent, ) = depositor.call{value: address(this).balance}("");
            require(sent, "Failed to send Ether");
            
            emit Cancelled(address(this).balance);
        }
        
        emit DisputeResolved(msg.sender, _approved);
    }
    
    /**
     * @dev Extend the timelock
     * @param _extension Additional time in seconds
     */
    function extendTimelock(uint256 _extension) external onlyDepositor notApproved notCancelled {
        require(hasTimelock, "No timelock set");
        require(_extension > 0, "Extension must be greater than 0");
        
        timelock += _extension;
        emit TimelockExtended(timelock);
    }
    
    /**
     * @dev Allow beneficiary to withdraw if timelock has expired
     */
    function timelockWithdraw() external onlyBeneficiary notApproved notCancelled {
        require(hasTimelock, "No timelock set");
        require(block.timestamp >= timelock, "Timelock has not expired yet");
        
        isApproved = true;
        
        (bool sent, ) = beneficiary.call{value: address(this).balance}("");
        require(sent, "Failed to send Ether");
        
        emit Approved(address(this).balance);
    }
    
    /**
     * @dev Get contract balance
     * @return Contract balance in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }
    
    /**
     * @dev Get number of milestones
     * @return Number of milestones
     */
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }
    
    /**
     * @dev Get contract status
     * @return isActive True if contract is still active
     * @return isLockedByTimelock True if protected by timelock
     * @return hasMilestonesEnabled True if using milestone-based payments
     * @return hasActiveDispute True if there's an ongoing dispute
     */
    function getStatus() external view returns (
        bool isActive,
        bool isLockedByTimelock,
        bool hasMilestonesEnabled,
        bool hasActiveDispute
    ) {
        isActive = !isApproved && !isCancelled;
        isLockedByTimelock = hasTimelock && block.timestamp < timelock;
        hasMilestonesEnabled = hasMilestones;
        hasActiveDispute = isDisputed;
    }
} 