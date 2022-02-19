use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("6FFmFrZMQxH3DB2VGwVaAR13tEgvmfyHVwhMVooot9VG");

#[program]
mod mysolanaapp {
    use super::*;

    pub fn post_comment(ctx: Context<PostComment>, username: String, message: String, site: String, path: String, node_hash: String, selection: String) -> ProgramResult {
        let comment: &mut Account<Comment> = &mut ctx.accounts.comment;
        let author: &Signer                = &ctx.accounts.author;
        let clock: Clock                   = Clock::get().unwrap();

        if username.chars().count() > 48 {
            return Err(ErrorCode::UsernameTooLong.into()) }
        if message.chars().count() > 1024 {
            return Err(ErrorCode::CommentTooLong.into()) }
                
        comment.author      = *author.key;
        comment.timestamp   = clock.unix_timestamp;
        comment.username    = username;
        comment.message     = message;
        comment.selection   = selection;
        comment.site        = site;
        comment.path        = path;
        comment.node_hash   = node_hash;
                
        Ok(()) }}

#[derive(Accounts)]
pub struct PostComment<'info> {
    #[account(init, payer = author, space = Comment::LEN)]
    pub comment: Account<'info, Comment>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }

// An account that goes inside a transaction instruction
#[account]
pub struct Comment {
  pub site:      String,
  pub path:      String,
  pub node_hash: String,
  pub author:    Pubkey,
  pub timestamp: i64,
  pub username:  String,
  pub message:   String, 
  pub selection: String, }

const DISCRIMINATOR_LENGTH: usize = 8;
const PUBLIC_KEY_LENGTH:    usize = 32;
const NODE_HASH_LENGTH:     usize = 32;
const TIMESTAMP_LENGTH:     usize = 8;
const STRING_LENGTH_PREFIX: usize = 4; // Stores the size of the string.
const MAX_USERNAME_LENGTH:  usize = 48 * 4; // 48 chars max.
const MAX_MESSAGE_LENGTH:   usize = 1024 * 4; // 1024 chars max.

impl Comment {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + PUBLIC_KEY_LENGTH // Site
        + PUBLIC_KEY_LENGTH // Author
        + PUBLIC_KEY_LENGTH // Path
        + NODE_HASH_LENGTH // Node hash
        + TIMESTAMP_LENGTH // Timestamp
        + STRING_LENGTH_PREFIX + MAX_USERNAME_LENGTH // Topic
        + STRING_LENGTH_PREFIX + MAX_MESSAGE_LENGTH  // Selection
        + STRING_LENGTH_PREFIX + MAX_MESSAGE_LENGTH; } // Comment

#[error]
pub enum ErrorCode {
    #[msg("The provided username should be 48 characters long maximum.")]
    UsernameTooLong,
    #[msg("The provided comment should be 1024 characters long maximum.")]
    CommentTooLong, }
