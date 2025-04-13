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
// Enhanced escrow program with milestones, timelock, and disputes
// Author: CryptoEscrow

/// Main escrow account data structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct EscrowAccount {
    // Status flags
    pub is_initialized: bool,
    pub is_approved: bool,
    pub is_cancelled: bool, 
    pub is_disputed: bool,
    
    // Main participants
    pub initializer_pubkey: Pubkey,
    pub beneficiary_pubkey: Pubkey,
    pub arbiter_pubkey: Pubkey,
    
    // Financial details
    pub amount: u64,
    
    // Contract details
    pub terms: String,
    pub creation_time: i64,
    pub timelock: i64,           // 0 means no timelock
    pub dispute_reason: String,  // Empty unless disputed
    
    // Advanced features
    pub milestone_enabled: bool,
    pub current_milestone: u8,
    pub milestone_count: u8,
}

/// Milestone data structure
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Milestone {
    pub description: String,
    pub amount: u64,
    pub is_completed: bool,
}

/// Instruction types for the escrow program
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum EscrowInstruction {
    /// Initialize a new escrow
    /// Accounts expected:
    /// 0. `[signer]` The initializer (depositor) account
    /// 1. `[writable]` The escrow account, holds state
    /// 2. `[]` The beneficiary account
    /// 3. `[]` The arbiter account
    /// 4. `[]` System program
    Initialize {
        // Amount in lamports
        amount: u64,
        // Terms of the escrow
        terms: String,
        // Optional timelock in seconds (0 for no timelock)
        timelock_duration: u64,
    },
    
    /// Approve the escrow, releasing funds to the beneficiary
    /// Accounts expected:
    /// 0. `[signer]` The arbiter account
    /// 1. `[writable]` The escrow account, holds state
    /// 2. `[writable]` The beneficiary account
    Approve {},
    
    /// Cancel the escrow, returning funds to initializer
    /// Only possible before timelock expiry
    /// Accounts expected:
    /// 0. `[signer]` The initializer (depositor) account
    /// 1. `[writable]` The escrow account, holds state
    Cancel {},
    
    /// Add a milestone to the escrow
    /// Accounts expected:
    /// 0. `[signer]` The initializer account
    /// 1. `[writable]` The escrow account
    /// 2. `[writable]` The milestone account
    AddMilestone {
        description: String,
        amount: u64,
    },
    
    /// Complete a milestone and release partial funds
    /// Accounts expected:
    /// 0. `[signer]` The arbiter account
    /// 1. `[writable]` The escrow account
    /// 2. `[writable]` The milestone account
    /// 3. `[writable]` The beneficiary account
    CompleteMilestone {
        milestone_index: u8,
    },
    
    /// Raise a dispute
    /// Accounts expected:
    /// 0. `[signer]` Either initializer or beneficiary
    /// 1. `[writable]` The escrow account
    RaiseDispute {
        reason: String,
    },
    
    /// Resolve a dispute
    /// Accounts expected:
    /// 0. `[signer]` The arbiter account
    /// 1. `[writable]` The escrow account
    /// 2. `[writable]` The beneficiary account (if approved)
    /// 3. `[writable]` The initializer account (if not approved)
    ResolveDispute {
        approve: bool,
    },
    
    /// Allow beneficiary to withdraw after timelock expiry
    /// Accounts expected:
    /// 0. `[signer]` The beneficiary account
    /// 1. `[writable]` The escrow account
    TimelockWithdraw {},
    
    /// Extend the timelock (only by initializer)
    /// Accounts expected:
    /// 0. `[signer]` The initializer account
    /// 1. `[writable]` The escrow account
    ExtendTimelock {
        extension_seconds: u64,
    },
}

// Program entrypoint
entrypoint!(process_instruction);

/// Process program instructions
fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Deserialize instruction data
    let instruction = EscrowInstruction::try_from_slice(instruction_data)?;
    
    // Process based on instruction type
    match instruction {
        EscrowInstruction::Initialize { amount, terms, timelock_duration } => {
            process_initialize(program_id, accounts, amount, terms, timelock_duration)
        }
        EscrowInstruction::Approve {} => process_approve(accounts),
        EscrowInstruction::Cancel {} => process_cancel(accounts),
        EscrowInstruction::AddMilestone { description, amount } => 
            process_add_milestone(accounts, description, amount),
        EscrowInstruction::CompleteMilestone { milestone_index } => 
            process_complete_milestone(accounts, milestone_index),
        EscrowInstruction::RaiseDispute { reason } => 
            process_raise_dispute(accounts, reason),
        EscrowInstruction::ResolveDispute { approve } => 
            process_resolve_dispute(accounts, approve),
        EscrowInstruction::TimelockWithdraw {} => 
            process_timelock_withdraw(accounts),
        EscrowInstruction::ExtendTimelock { extension_seconds } => 
            process_extend_timelock(accounts, extension_seconds),
    }
}

/// Initialize a new escrow
fn process_initialize(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    terms: String,
    timelock_duration: u64,
) -> ProgramResult {
    msg!("🔷 Initializing new escrow");
    
    let account_info_iter = &mut accounts.iter();
    
    let initializer = next_account_info(account_info_iter)?;
    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    let beneficiary = next_account_info(account_info_iter)?;
    let arbiter = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    
    // Get current time
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;
    
    // Calculate timelock (0 means no timelock)
    let timelock = if timelock_duration > 0 {
        current_time + (timelock_duration as i64)
    } else {
        0
    };
    
    // Transfer funds from initializer to escrow account
    let transfer_instruction = system_instruction::transfer(
        initializer.key,
        escrow_account.key,
        amount,
    );
    
    invoke(
        &transfer_instruction,
        &[
            initializer.clone(),
            escrow_account.clone(),
            system_program.clone(),
        ],
    )?;
    
    // Create escrow state
    let escrow_info = EscrowAccount {
        is_initialized: true,
        is_approved: false,
        is_cancelled: false,
        is_disputed: false,
        initializer_pubkey: *initializer.key,
        beneficiary_pubkey: *beneficiary.key,
        arbiter_pubkey: *arbiter.key,
        amount,
        terms,
        creation_time: current_time,
        timelock,
        dispute_reason: String::new(),
        milestone_enabled: false,
        current_milestone: 0,
        milestone_count: 0,
    };
    
    // Save to escrow account
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Escrow initialized with amount: {}", amount);
    Ok(())
}

/// Approve escrow and release funds
fn process_approve(accounts: &[AccountInfo]) -> ProgramResult {
    msg!("🔷 Approving escrow");
    
    let account_info_iter = &mut accounts.iter();
    
    let arbiter = next_account_info(account_info_iter)?;
    if !arbiter.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    let beneficiary = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid
    if !escrow_info.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }
    
    if escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify arbiter is authorized
    if escrow_info.arbiter_pubkey != *arbiter.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify beneficiary is correct
    if escrow_info.beneficiary_pubkey != *beneficiary.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Transfer funds from escrow to beneficiary
    **escrow_account.try_borrow_mut_lamports()? = escrow_account
        .lamports()
        .checked_sub(escrow_info.amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    **beneficiary.try_borrow_mut_lamports()? = beneficiary
        .lamports()
        .checked_add(escrow_info.amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    // Mark as approved
    escrow_info.is_approved = true;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Escrow approved and {} lamports transferred to beneficiary", escrow_info.amount);
    Ok(())
}

/// Cancel escrow and return funds to initializer
fn process_cancel(accounts: &[AccountInfo]) -> ProgramResult {
    msg!("🔷 Cancelling escrow");
    
    let account_info_iter = &mut accounts.iter();
    
    let initializer = next_account_info(account_info_iter)?;
    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid
    if !escrow_info.is_initialized {
        return Err(ProgramError::UninitializedAccount);
    }
    
    if escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify initializer is authorized
    if escrow_info.initializer_pubkey != *initializer.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Check timelock if present
    if escrow_info.timelock > 0 {
        let clock = Clock::get()?;
        if clock.unix_timestamp >= escrow_info.timelock {
            return Err(ProgramError::Custom(100)); // Custom error: Timelock expired
        }
    }
    
    // Transfer funds back to initializer
    **escrow_account.try_borrow_mut_lamports()? = escrow_account
        .lamports()
        .checked_sub(escrow_info.amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    **initializer.try_borrow_mut_lamports()? = initializer
        .lamports()
        .checked_add(escrow_info.amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    // Mark as cancelled
    escrow_info.is_cancelled = true;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Escrow cancelled and funds returned to initializer");
    Ok(())
}

/// Add a milestone to the escrow
fn process_add_milestone(
    accounts: &[AccountInfo],
    description: String,
    amount: u64,
) -> ProgramResult {
    msg!("🔷 Adding milestone to escrow");
    
    let account_info_iter = &mut accounts.iter();
    
    let initializer = next_account_info(account_info_iter)?;
    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    let milestone_account = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid and not approved/cancelled
    if !escrow_info.is_initialized || escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify initializer is authorized
    if escrow_info.initializer_pubkey != *initializer.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Enable milestones if not already enabled
    if !escrow_info.milestone_enabled {
        escrow_info.milestone_enabled = true;
        escrow_info.current_milestone = 0;
    }
    
    // Create milestone
    let milestone = Milestone {
        description,
        amount,
        is_completed: false,
    };
    
    // Save milestone to milestone account
    milestone.serialize(&mut &mut milestone_account.data.borrow_mut()[..])?;
    
    // Update milestone count
    escrow_info.milestone_count += 1;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Milestone added with amount: {}", amount);
    Ok(())
}

/// Complete a milestone and release funds
fn process_complete_milestone(
    accounts: &[AccountInfo],
    milestone_index: u8,
) -> ProgramResult {
    msg!("🔷 Completing milestone");
    
    let account_info_iter = &mut accounts.iter();
    
    let arbiter = next_account_info(account_info_iter)?;
    if !arbiter.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    let milestone_account = next_account_info(account_info_iter)?;
    let beneficiary = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid and has milestones
    if !escrow_info.is_initialized || !escrow_info.milestone_enabled || 
       escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify arbiter and beneficiary
    if escrow_info.arbiter_pubkey != *arbiter.key || 
       escrow_info.beneficiary_pubkey != *beneficiary.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify milestone index
    if milestone_index >= escrow_info.milestone_count {
        return Err(ProgramError::InvalidArgument);
    }
    
    // Deserialize milestone
    let mut milestone = Milestone::try_from_slice(&milestone_account.data.borrow())?;
    
    // Verify milestone isn't already completed
    if milestone.is_completed {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Mark milestone as completed
    milestone.is_completed = true;
    milestone.serialize(&mut &mut milestone_account.data.borrow_mut()[..])?;
    
    // Transfer funds from escrow to beneficiary
    let payment_amount = milestone.amount;
    
    **escrow_account.try_borrow_mut_lamports()? = escrow_account
        .lamports()
        .checked_sub(payment_amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    **beneficiary.try_borrow_mut_lamports()? = beneficiary
        .lamports()
        .checked_add(payment_amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    // Update current milestone
    escrow_info.current_milestone = milestone_index + 1;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Milestone {} completed with payment: {}", milestone_index, payment_amount);
    Ok(())
}

/// Raise a dispute
fn process_raise_dispute(
    accounts: &[AccountInfo],
    reason: String,
) -> ProgramResult {
    msg!("🔷 Raising dispute");
    
    let account_info_iter = &mut accounts.iter();
    
    let party = next_account_info(account_info_iter)?;
    if !party.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid
    if !escrow_info.is_initialized || escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify party is either initializer or beneficiary
    if escrow_info.initializer_pubkey != *party.key && 
       escrow_info.beneficiary_pubkey != *party.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Mark escrow as disputed
    escrow_info.is_disputed = true;
    escrow_info.dispute_reason = reason;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Dispute raised");
    Ok(())
}

/// Resolve a dispute
fn process_resolve_dispute(
    accounts: &[AccountInfo],
    approve: bool,
) -> ProgramResult {
    msg!("🔷 Resolving dispute");
    
    let account_info_iter = &mut accounts.iter();
    
    let arbiter = next_account_info(account_info_iter)?;
    if !arbiter.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    let beneficiary = next_account_info(account_info_iter)?;
    let initializer = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid and disputed
    if !escrow_info.is_initialized || !escrow_info.is_disputed || 
       escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify arbiter
    if escrow_info.arbiter_pubkey != *arbiter.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify beneficiary and initializer
    if escrow_info.beneficiary_pubkey != *beneficiary.key || 
       escrow_info.initializer_pubkey != *initializer.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Resolve in favor of beneficiary
    if approve {
        // Transfer funds to beneficiary
        **escrow_account.try_borrow_mut_lamports()? = escrow_account
            .lamports()
            .checked_sub(escrow_info.amount)
            .ok_or(ProgramError::InsufficientFunds)?;
        
        **beneficiary.try_borrow_mut_lamports()? = beneficiary
            .lamports()
            .checked_add(escrow_info.amount)
            .ok_or(ProgramError::InsufficientFunds)?;
        
        escrow_info.is_approved = true;
        msg!("✅ Dispute resolved in favor of beneficiary");
    } else {
        // Transfer funds back to initializer
        **escrow_account.try_borrow_mut_lamports()? = escrow_account
            .lamports()
            .checked_sub(escrow_info.amount)
            .ok_or(ProgramError::InsufficientFunds)?;
        
        **initializer.try_borrow_mut_lamports()? = initializer
            .lamports()
            .checked_add(escrow_info.amount)
            .ok_or(ProgramError::InsufficientFunds)?;
        
        escrow_info.is_cancelled = true;
        msg!("✅ Dispute resolved in favor of initializer");
    }
    
    // Update escrow
    escrow_info.is_disputed = false;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    Ok(())
}

/// Withdraw after timelock expiry
fn process_timelock_withdraw(accounts: &[AccountInfo]) -> ProgramResult {
    msg!("🔷 Processing timelock withdrawal");
    
    let account_info_iter = &mut accounts.iter();
    
    let beneficiary = next_account_info(account_info_iter)?;
    if !beneficiary.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid
    if !escrow_info.is_initialized || escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify beneficiary
    if escrow_info.beneficiary_pubkey != *beneficiary.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify timelock exists and has expired
    if escrow_info.timelock <= 0 {
        return Err(ProgramError::InvalidAccountData);
    }
    
    let clock = Clock::get()?;
    if clock.unix_timestamp < escrow_info.timelock {
        return Err(ProgramError::Custom(101)); // Custom error: Timelock not expired
    }
    
    // Transfer funds to beneficiary
    **escrow_account.try_borrow_mut_lamports()? = escrow_account
        .lamports()
        .checked_sub(escrow_info.amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    **beneficiary.try_borrow_mut_lamports()? = beneficiary
        .lamports()
        .checked_add(escrow_info.amount)
        .ok_or(ProgramError::InsufficientFunds)?;
    
    // Mark as approved
    escrow_info.is_approved = true;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Timelock expired, funds transferred to beneficiary");
    Ok(())
}

/// Extend the timelock
fn process_extend_timelock(
    accounts: &[AccountInfo],
    extension_seconds: u64,
) -> ProgramResult {
    msg!("🔷 Extending timelock");
    
    let account_info_iter = &mut accounts.iter();
    
    let initializer = next_account_info(account_info_iter)?;
    if !initializer.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    let escrow_account = next_account_info(account_info_iter)?;
    
    // Deserialize escrow state
    let mut escrow_info = EscrowAccount::try_from_slice(&escrow_account.data.borrow())?;
    
    // Verify escrow is valid
    if !escrow_info.is_initialized || escrow_info.is_approved || escrow_info.is_cancelled {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify initializer
    if escrow_info.initializer_pubkey != *initializer.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Verify timelock exists
    if escrow_info.timelock <= 0 {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Extend timelock
    escrow_info.timelock += extension_seconds as i64;
    escrow_info.serialize(&mut &mut escrow_account.data.borrow_mut()[..])?;
    
    msg!("✅ Timelock extended to: {}", escrow_info.timelock);
    Ok(())
} 