// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./Escrow.sol";

/**
 * @title Enhanced Escrow Factory
 * @dev Factory contract for deploying and managing Escrow contracts
 * @author CryptoEscrow
 */
contract EscrowFactory {
    // Array to store all created escrow contracts
    address[] public escrows;
    
    // Mapping of user addresses to their escrow contracts
    mapping(address => address[]) public userEscrows;
    
    // Types of users involved in escrows
    enum UserRole { Depositor, Beneficiary, Arbiter }
    
    // Stats about the factory
    uint256 public totalEscrowsCreated;
    uint256 public totalValueLocked;
    
    // Fee mechanism (in basis points, 1 = 0.01%)
    uint256 public fee; // e.g., 25 = 0.25%
    address public feeCollector;
    bool public feesEnabled;
    
    // Events
    event EscrowCreated(
        address indexed escrowAddress,
        address indexed depositor,
        address indexed beneficiary,
        address arbiter,
        uint256 amount,
        string terms,
        uint256 timelock
    );
    event FeeUpdated(uint256 newFee);
    event FeeCollectorUpdated(address newCollector);
    event FeesToggled(bool enabled);
    
    /**
     * @dev Constructor initializes the factory with the fee collector
     * @param _feeCollector Address to collect fees
     * @param _initialFee Initial fee in basis points (100 = 1%)
     */
    constructor(address _feeCollector, uint256 _initialFee) {
        require(_feeCollector != address(0), "Fee collector cannot be zero address");
        require(_initialFee <= 500, "Fee cannot exceed 5%");
        
        feeCollector = _feeCollector;
        fee = _initialFee;
        feesEnabled = true;
    }
    
    /**
     * @dev Create a new escrow contract
     * @param _arbiter Address of the arbiter
     * @param _beneficiary Address of the beneficiary
     * @param _terms Description of escrow terms
     * @param _timelock Optional timelock in seconds
     * @return Address of the created escrow contract
     */
    function createEscrow(
        address _arbiter,
        address _beneficiary,
        string memory _terms,
        uint256 _timelock
    ) external payable returns (address) {
        require(_arbiter != address(0), "Arbiter cannot be zero address");
        require(_beneficiary != address(0), "Beneficiary cannot be zero address");
        require(bytes(_terms).length > 0, "Terms cannot be empty");
        
        uint256 amount = msg.value;
        uint256 feeAmount = 0;
        
        // Calculate and deduct fee if enabled
        if (feesEnabled && fee > 0) {
            feeAmount = (amount * fee) / 10000;
            amount -= feeAmount;
            
            // Send fee to fee collector
            (bool feeTransferred, ) = feeCollector.call{value: feeAmount}("");
            require(feeTransferred, "Fee transfer failed");
        }
        
        // Create the escrow contract with the remaining amount
        Escrow escrow = new Escrow{value: amount}(
            _arbiter,
            _beneficiary,
            _terms,
            _timelock
        );
        
        address escrowAddress = address(escrow);
        
        // Add to global list
        escrows.push(escrowAddress);
        
        // Add to user's lists
        userEscrows[msg.sender].push(escrowAddress);
        
        // Add to beneficiary's list
        if (_beneficiary != msg.sender) {
            userEscrows[_beneficiary].push(escrowAddress);
        }
        
        // Add to arbiter's list
        if (_arbiter != msg.sender && _arbiter != _beneficiary) {
            userEscrows[_arbiter].push(escrowAddress);
        }
        
        // Update stats
        totalEscrowsCreated++;
        totalValueLocked += amount;
        
        emit EscrowCreated(
            escrowAddress,
            msg.sender,
            _beneficiary,
            _arbiter,
            amount,
            _terms,
            _timelock
        );
        
        return escrowAddress;
    }
    
    /**
     * @dev Get all escrows created by the factory
     * @return Array of escrow addresses
     */
    function getAllEscrows() external view returns (address[] memory) {
        return escrows;
    }
    
    /**
     * @dev Get escrows associated with a specific user
     * @param _user Address of the user
     * @return Array of escrow addresses
     */
    function getUserEscrows(address _user) external view returns (address[] memory) {
        return userEscrows[_user];
    }
    
    /**
     * @dev Get total number of escrows
     * @return Total count of escrow contracts
     */
    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }
    
    /**
     * @dev Get paginated escrows 
     * @param _offset Starting index
     * @param _limit Maximum number of items to return
     * @return Array of escrow addresses within the specified range
     */
    function getPaginatedEscrows(uint256 _offset, uint256 _limit) external view returns (address[] memory) {
        require(_offset < escrows.length, "Offset out of bounds");
        
        uint256 endIndex = _offset + _limit;
        if (endIndex > escrows.length) {
            endIndex = escrows.length;
        }
        
        uint256 resultSize = endIndex - _offset;
        address[] memory result = new address[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            result[i] = escrows[_offset + i];
        }
        
        return result;
    }
    
    /**
     * @dev Get details of multiple escrows at once
     * @param _escrows Array of escrow addresses
     * @return arbiterAddresses Array of arbiter addresses
     * @return beneficiaryAddresses Array of beneficiary addresses
     * @return depositorAddresses Array of depositor addresses
     * @return amounts Array of escrow amounts
     * @return statuses Array of approval statuses (true if approved)
     */
    function batchGetEscrowDetails(address[] memory _escrows) 
        external 
        view 
        returns (
            address[] memory arbiterAddresses,
            address[] memory beneficiaryAddresses,
            address[] memory depositorAddresses,
            uint256[] memory amounts,
            bool[] memory statuses
        ) 
    {
        uint256 length = _escrows.length;
        arbiterAddresses = new address[](length);
        beneficiaryAddresses = new address[](length);
        depositorAddresses = new address[](length);
        amounts = new uint256[](length);
        statuses = new bool[](length);
        
        for (uint256 i = 0; i < length; i++) {
            Escrow escrow = Escrow(_escrows[i]);
            arbiterAddresses[i] = escrow.arbiter();
            beneficiaryAddresses[i] = escrow.beneficiary();
            depositorAddresses[i] = escrow.depositor();
            amounts[i] = escrow.amount();
            statuses[i] = escrow.isApproved();
        }
        
        return (arbiterAddresses, beneficiaryAddresses, depositorAddresses, amounts, statuses);
    }
    
    /**
     * @dev Get filtered escrows by a specific user's role
     * @param _user Address of the user
     * @param _role User's role (0=Depositor, 1=Beneficiary, 2=Arbiter)
     * @return Array of escrow addresses matching the criteria
     */
    function getEscrowsByUserRole(address _user, UserRole _role) external view returns (address[] memory) {
        uint256 count = 0;
        uint256 total = escrows.length;
        address[] memory tempEscrows = new address[](total);
        
        for (uint256 i = 0; i < total; i++) {
            Escrow escrow = Escrow(escrows[i]);
            
            bool matches = false;
            if (_role == UserRole.Depositor && escrow.depositor() == _user) {
                matches = true;
            } else if (_role == UserRole.Beneficiary && escrow.beneficiary() == _user) {
                matches = true;
            } else if (_role == UserRole.Arbiter && escrow.arbiter() == _user) {
                matches = true;
            }
            
            if (matches) {
                tempEscrows[count] = escrows[i];
                count++;
            }
        }
        
        // Create result array with exact size
        address[] memory result = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = tempEscrows[i];
        }
        
        return result;
    }
    
    /**
     * @dev Update the fee percentage (only contract creator)
     * @param _newFee New fee in basis points (100 = 1%)
     */
    function updateFee(uint256 _newFee) external {
        require(msg.sender == feeCollector, "Only fee collector can update fee");
        require(_newFee <= 500, "Fee cannot exceed 5%");
        
        fee = _newFee;
        emit FeeUpdated(_newFee);
    }
    
    /**
     * @dev Update the fee collector address (only current fee collector)
     * @param _newCollector New fee collector address
     */
    function updateFeeCollector(address _newCollector) external {
        require(msg.sender == feeCollector, "Only current fee collector can update");
        require(_newCollector != address(0), "Fee collector cannot be zero address");
        
        feeCollector = _newCollector;
        emit FeeCollectorUpdated(_newCollector);
    }
    
    /**
     * @dev Toggle fee collection on/off (only fee collector)
     * @param _enabled Whether fees should be enabled
     */
    function toggleFees(bool _enabled) external {
        require(msg.sender == feeCollector, "Only fee collector can toggle fees");
        
        feesEnabled = _enabled;
        emit FeesToggled(_enabled);
    }
} 