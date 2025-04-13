use solana_program::{
    account_info::{next_account_info, AccountInfo},
    clock::Clock,
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    sysvar::Sysvar,
    program::{invoke, invoke_signed},
    system_instruction,
};
use borsh::{BorshDeserialize, BorshSerialize};

// ============================================================================
// █▀▀ █▀█ █▄█ █▀█ ▀█▀ █▀█   █▀▀ █▀ █▀▀ █▀█ █▀█ █░█░█
// █▄▄ █▀▄ ░█░ █▀▀ ░█░ █▄█   ██▄ ▄█ █▄▄ █▀▄ █▄█ ▀▄▀▄▀
// ============================================================================
// Enhanced escrow factory program for creating and managing multiple escrows
// Author: CryptoEscrow

/// User roles in escrow relationships
#[derive(BorshSerialize, BorshDeserialize, Debug, PartialEq)]
pub enum UserRole {
    Depositor,
    Beneficiary,
    Arbiter,
}

/// Factory account data structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct FactoryAccount {
    pub owner: Pubkey,
    pub escrow_count: u64,
    pub total_value_locked: u64,
    pub fee_percentage: u8,           // In basis points (e.g., 25 = 0.25%)
    pub fee_collector: Pubkey,
    pub fee_enabled: bool,
}

/// Instruction types for the factory program
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum FactoryInstruction {
    /// Initialize a new factory
    /// Accounts expected:
    /// 0. `[signer]` The owner account
    /// 1. `[writable]` The factory account, holds state
    Initialize {
        fee_percentage: u8,
        fee_collector: Pubkey,
        fee_enabled: bool,
    },

    /// Create a new escrow using the escrow program
    /// Accounts expected:
    /// 0. `[signer]` The initializer (depositor) account
    /// 1. `[writable]` The factory account
    /// 2. `[writable]` The new escrow account to be created
    /// 3. `[]` The beneficiary account
    /// 4. `[]` The arbiter account
    /// 5. `[]` The escrow program ID
    /// 6. `[]` The system program
    /// 7. `[writable]` The fee collector account (if fee_enabled)
    CreateEscrow {
        amount: u64,
        terms: String,
        timelock_duration: u64,  // Optional timelock
    },
    
    /// Update fee settings (owner only)
    /// Accounts expected:
    /// 0. `[signer]` The owner account
    /// 1. `[writable]` The factory account
    UpdateFee {
        fee_percentage: u8,
    },
    
    /// Update fee collector (owner only)
    /// Accounts expected:
    /// 0. `[signer]` The owner account
    /// 1. `[writable]` The factory account
    UpdateFeeCollector {
        fee_collector: Pubkey,
    },
    
    /// Toggle fee collection (owner only)
    /// Accounts expected:
    /// 0. `[signer]` The owner account
    /// 1. `[writable]` The factory account
    ToggleFee {
        enabled: bool,
    },
}

// Program entrypoint
entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = FactoryInstruction::try_from_slice(instruction_data)?;
    
    match instruction {
        FactoryInstruction::Initialize { fee_percentage, fee_collector, fee_enabled } => {
            process_initialize(accounts, fee_percentage, fee_collector, fee_enabled)
        }
        FactoryInstruction::CreateEscrow { amount, terms, timelock_duration } => {
            process_create_escrow(program_id, accounts, amount, terms, timelock_duration)
        }
        FactoryInstruction::UpdateFee { fee_percentage } => {
            process_update_fee(accounts, fee_percentage)
        }
        FactoryInstruction::UpdateFeeCollector { fee_collector } => {
            process_update_fee_collector(accounts, fee_collector)
        }
        FactoryInstruction::ToggleFee { enabled } => {
            process_toggle_fee(accounts, enabled)
        }
    }
}

/// Initialize a new factory
fn process_initialize(
    accounts: &[AccountInfo],
    fee_percentage: u8,
    fee_collector: Pubkey,
    fee_enabled: bool,
) -> ProgramResult {
    msg!("🔷 Initializing escrow factory");
    
    let account_info_iter = &mut accounts.iter();
    
    let owner = next_account_info(account_info_iter)?;
    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let factory_account = next_account_info(account_info_iter)?;
    
    // Verify fee percentage <= 500 basis points (5%)
    if fee_percentage > 500 {
        return Err(ProgramError::InvalidArgument);
    }
    
    // Initialize factory state
    let factory_info = FactoryAccount {
        owner: *owner.key,
        escrow_count: 0,
        total_value_locked: 0,
        fee_percentage,
        fee_collector,
        fee_enabled,
    };
    
    // Save to factory account
    factory_info.serialize(&mut &mut factory_account.data.borrow_mut()[..])?;
    
    msg!("✅ Escrow factory initialized with fee: {}/10000", fee_percentage);
    Ok(())
}

/// Create a new escrow using the escrow program
fn process_create_escrow(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    terms: String,
    timelock_duration: u64,
) -> ProgramResult {
    msg!("🔷 Creating new escrow through factory");
    
    let account_info_iter = &mut accounts.iter();
    
    let initializer = next_account_info(account_info_iter)?;
    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let factory_account = next_account_info(account_info_iter)?;
    let escrow_account = next_account_info(account_info_iter)?;
    let beneficiary = next_account_info(account_info_iter)?;
    let arbiter = next_account_info(account_info_iter)?;
    let escrow_program = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    
    // Deserialize factory state
    let mut factory_info = FactoryAccount::try_from_slice(&factory_account.data.borrow())?;
    
    // Calculate fee if enabled
    let mut fee_amount = 0;
    if factory_info.fee_enabled && factory_info.fee_percentage > 0 {
        fee_amount = (amount * factory_info.fee_percentage as u64) / 10000;
        let fee_collector = next_account_info(account_info_iter)?;
        
        // Verify fee collector key
        if *fee_collector.key != factory_info.fee_collector {
            return Err(ProgramError::InvalidArgument);
        }
        
        // Transfer fee to collector
        let transfer_fee_instruction = system_instruction::transfer(
            initializer.key,
            fee_collector.key,
            fee_amount,
        );
        
        invoke(
            &transfer_fee_instruction,
            &[
                initializer.clone(),
                fee_collector.clone(),
                system_program.clone(),
            ],
        )?;
        
        msg!("✅ Fee of {} lamports transferred to collector", fee_amount);
    }
    
    // Adjusted amount after fee
    let escrow_amount = amount - fee_amount;
    
    // Create initialization instruction for escrow program
    let mut escrow_init_data = vec![];
    borsh::BorshSerialize::serialize(
        &escrow_program::EscrowInstruction::Initialize {
            amount: escrow_amount,
            terms,
            timelock_duration,
        },
        &mut escrow_init_data,
    )?;
    
    // Invoke the escrow program to initialize the escrow
    invoke(
        &solana_program::instruction::Instruction {
            program_id: *escrow_program.key,
            accounts: vec![
                solana_program::instruction::AccountMeta::new(*initializer.key, true),
                solana_program::instruction::AccountMeta::new(*escrow_account.key, false),
                solana_program::instruction::AccountMeta::new_readonly(*beneficiary.key, false),
                solana_program::instruction::AccountMeta::new_readonly(*arbiter.key, false),
                solana_program::instruction::AccountMeta::new_readonly(*system_program.key, false),
            ],
            data: escrow_init_data,
        },
        &[
            initializer.clone(),
            escrow_account.clone(),
            beneficiary.clone(),
            arbiter.clone(),
            system_program.clone(),
        ],
    )?;
    
    // Update factory stats
    factory_info.escrow_count += 1;
    factory_info.total_value_locked += escrow_amount;
    factory_info.serialize(&mut &mut factory_account.data.borrow_mut()[..])?;
    
    msg!("✅ Escrow created through factory. Total: {}", factory_info.escrow_count);
    Ok(())
}

/// Update fee percentage
fn process_update_fee(
    accounts: &[AccountInfo],
    fee_percentage: u8,
) -> ProgramResult {
    msg!("🔷 Updating factory fee");
    
    let account_info_iter = &mut accounts.iter();
    
    let owner = next_account_info(account_info_iter)?;
    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let factory_account = next_account_info(account_info_iter)?;
    
    // Deserialize factory state
    let mut factory_info = FactoryAccount::try_from_slice(&factory_account.data.borrow())?;
    
    // Verify owner
    if factory_info.owner != *owner.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify fee percentage <= 500 basis points (5%)
    if fee_percentage > 500 {
        return Err(ProgramError::InvalidArgument);
    }
    
    // Update fee percentage
    factory_info.fee_percentage = fee_percentage;
    factory_info.serialize(&mut &mut factory_account.data.borrow_mut()[..])?;
    
    msg!("✅ Fee percentage updated to: {}/10000", fee_percentage);
    Ok(())
}

/// Update fee collector
fn process_update_fee_collector(
    accounts: &[AccountInfo],
    fee_collector: Pubkey,
) -> ProgramResult {
    msg!("🔷 Updating fee collector");
    
    let account_info_iter = &mut accounts.iter();
    
    let owner = next_account_info(account_info_iter)?;
    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let factory_account = next_account_info(account_info_iter)?;
    
    // Deserialize factory state
    let mut factory_info = FactoryAccount::try_from_slice(&factory_account.data.borrow())?;
    
    // Verify owner
    if factory_info.owner != *owner.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Update fee collector
    factory_info.fee_collector = fee_collector;
    factory_info.serialize(&mut &mut factory_account.data.borrow_mut()[..])?;
    
    msg!("✅ Fee collector updated");
    Ok(())
}

/// Toggle fee collection
fn process_toggle_fee(
    accounts: &[AccountInfo],
    enabled: bool,
) -> ProgramResult {
    msg!("🔷 Toggling fee collection");
    
    let account_info_iter = &mut accounts.iter();
    
    let owner = next_account_info(account_info_iter)?;
    if !owner.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let factory_account = next_account_info(account_info_iter)?;
    
    // Deserialize factory state
    let mut factory_info = FactoryAccount::try_from_slice(&factory_account.data.borrow())?;
    
    // Verify owner
    if factory_info.owner != *owner.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Toggle fee collection
    factory_info.fee_enabled = enabled;
    factory_info.serialize(&mut &mut factory_account.data.borrow_mut()[..])?;
    
    msg!("✅ Fee collection {}abled", if enabled { "en" } else { "dis" });
    Ok(())
}

/// Get escrow accounts by user role
pub fn get_escrows_by_user_role(
    factory: &Pubkey,
    user: &Pubkey,
    role: UserRole,
) -> Vec<Pubkey> {
    // Implementation would query all escrows and filter by role
    // This would be implemented on the client side
    vec![]
}

/// Get all escrows created by the factory
pub fn get_all_escrows(factory: &Pubkey) -> Vec<Pubkey> {
    // Implementation would query all escrows created by the factory
    // This would be implemented on the client side
    vec![]
}

/// Get escrow count
pub fn get_escrow_count(factory: &Pubkey) -> u64 {
    // Implementation would return the escrow count from the factory
    // This would be implemented on the client side
    0
}

/// Get total value locked in the factory
pub fn get_total_value_locked(factory: &Pubkey) -> u64 {
    // Implementation would return the total value locked from the factory
    // This would be implemented on the client side
    0
} 