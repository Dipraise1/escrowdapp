import { ethers } from 'ethers';

// Factory ABI - Only the functions we need
export const EscrowFactoryABI = [
  "function createEscrow(address _arbiter, address _beneficiary, string memory _terms, uint256 _timelock) external payable returns (address)",
  "function getUserEscrows(address _user) external view returns (address[] memory)",
  "function batchGetEscrowDetails(address[] memory _escrows) external view returns (address[] memory arbiterAddresses, address[] memory beneficiaryAddresses, address[] memory depositorAddresses, uint256[] memory amounts, bool[] memory statuses)",
  "function getEscrowCount() external view returns (uint256)"
];

// Escrow ABI - Only the functions we need
export const EscrowABI = [
  "function arbiter() external view returns (address)",
  "function beneficiary() external view returns (address)",
  "function depositor() external view returns (address)",
  "function amount() external view returns (uint256)",
  "function terms() external view returns (string memory)",
  "function isApproved() external view returns (bool)",
  "function isCancelled() external view returns (bool)",
  "function approve() external",
  "function cancel() external",
  "function deposit() external payable",
  "function getStatus() external view returns (bool isActive, bool isLockedByTimelock, bool hasMilestonesEnabled, bool hasActiveDispute)"
];

// Contract addresses - Replace with your deployed contract addresses
export const ETHEREUM_FACTORY_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"; // This is a placeholder

export interface EscrowData {
  address: string;
  arbiter: string;
  beneficiary: string;
  depositor: string;
  amount: string;
  isApproved: boolean;
  isCancelled?: boolean;
  isYours: boolean;
  isArbiter: boolean;
  isBeneficiary: boolean;
  status?: {
    isActive: boolean;
    isLockedByTimelock: boolean;
    hasMilestonesEnabled: boolean;
    hasActiveDispute: boolean;
  };
  terms?: string;
  showDetails?: boolean;
}

// Format address to display
export const formatAddress = (address: string): string => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Get user's escrows
export const getUserEscrows = async (
  provider: any, 
  address: string
): Promise<EscrowData[]> => {
  try {
    const ethersProvider = new ethers.BrowserProvider(provider);
    const signer = await ethersProvider.getSigner();
    const factory = new ethers.Contract(ETHEREUM_FACTORY_ADDRESS, EscrowFactoryABI, signer);
    
    // Get user's escrows
    const userEscrows = await factory.getUserEscrows(address);
    
    if (userEscrows.length > 0) {
      // Get details for all escrows
      const details = await factory.batchGetEscrowDetails(userEscrows);
      
      // Format escrow data
      const escrowsData = await Promise.all(userEscrows.map(async (addr: string, i: number) => {
        const escrowContract = new ethers.Contract(addr, EscrowABI, signer);
        
        let isCancelled = false;
        let terms = '';
        
        try {
          isCancelled = await escrowContract.isCancelled();
          terms = await escrowContract.terms();
        } catch (error) {
          console.error(`Error fetching additional details for escrow ${addr}:`, error);
        }
        
        return {
          address: addr,
          arbiter: details.arbiterAddresses[i],
          beneficiary: details.beneficiaryAddresses[i],
          depositor: details.depositorAddresses[i],
          amount: ethers.formatEther(details.amounts[i]),
          isApproved: details.statuses[i],
          isCancelled,
          terms,
          isYours: details.depositorAddresses[i].toLowerCase() === address.toLowerCase(),
          isArbiter: details.arbiterAddresses[i].toLowerCase() === address.toLowerCase(),
          isBeneficiary: details.beneficiaryAddresses[i].toLowerCase() === address.toLowerCase(),
          showDetails: false
        };
      }));
      
      return escrowsData;
    }
    
    return [];
  } catch (error) {
    console.error('Error loading escrows:', error);
    throw error;
  }
};

// Create a new escrow
export const createEscrow = async (
  provider: any,
  beneficiary: string,
  arbiter: string,
  terms: string,
  amount: string,
  timelock: number = 0
): Promise<ethers.ContractTransactionResponse> => {
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const factory = new ethers.Contract(ETHEREUM_FACTORY_ADDRESS, EscrowFactoryABI, signer);
  
  // Convert amount to wei
  const amountInWei = ethers.parseEther(amount);
  
  // Send transaction to create escrow
  const tx = await factory.createEscrow(
    arbiter,
    beneficiary,
    terms,
    timelock,
    { value: amountInWei }
  );
  
  return tx;
};

// Approve an escrow (arbiter only)
export const approveEscrow = async (
  provider: any,
  escrowAddress: string
): Promise<ethers.ContractTransactionResponse> => {
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const escrowContract = new ethers.Contract(escrowAddress, EscrowABI, signer);
  
  // Send transaction to approve escrow
  const tx = await escrowContract.approve();
  return tx;
};

// Cancel an escrow (depositor only)
export const cancelEscrow = async (
  provider: any,
  escrowAddress: string
): Promise<ethers.ContractTransactionResponse> => {
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const escrowContract = new ethers.Contract(escrowAddress, EscrowABI, signer);
  
  // Send transaction to cancel escrow
  const tx = await escrowContract.cancel();
  return tx;
};

// Get detailed status of an escrow
export const getEscrowStatus = async (
  provider: any,
  escrowAddress: string
): Promise<{
  isActive: boolean;
  isLockedByTimelock: boolean;
  hasMilestonesEnabled: boolean;
  hasActiveDispute: boolean;
}> => {
  const ethersProvider = new ethers.BrowserProvider(provider);
  const signer = await ethersProvider.getSigner();
  const escrowContract = new ethers.Contract(escrowAddress, EscrowABI, signer);
  
  const status = await escrowContract.getStatus();
  
  return {
    isActive: status[0],
    isLockedByTimelock: status[1],
    hasMilestonesEnabled: status[2],
    hasActiveDispute: status[3]
  };
}; 