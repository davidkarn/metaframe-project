use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use byteorder::{ByteOrder, LittleEndian}; 

declare_id!("G5M7avXmeBtrML6hAcrJWzhvKTyoGXYtUvvsAWX4E91p");

#[program]
pub mod mf_default_moderation {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        let baseAccount: &mut Account<BaseAccount> = &mut ctx.accounts.baseAccount;
        let program = "
{\"name\":\"default\",
\"voting\":\"updown\",
\"scorer\":[\"block\",
  [\"set\", \"scores\", 
    [\"pull-account\", [\"pda\", [\"lst\", [\"str\", \"siteScore\"], \"site-hash\"], 
    \"program-id\"]]],
  [\"set\", \"this-score\", [\"find-value\", \"scores\", \"comment-id\"]]
  [\"if\", \"this-score\",
   [\"block\",
    [\"set\", \"up\", [\"nth\", \"this-score\", 0]],
    [\"set\", \"down\", [\"nth\", \"this-score\", 1]],
    [\"-\", \"up\", \"down\"]],
   0]],
\"upvote\":[\"block\"
  [\"set\", [\"lst\", \"acct\", \"bump\"],
            [\"pull-account\", [\"pda\", [\"lst\", [\"str\", \"siteScore\"], \"site-hash\"],
                                         \"program-id\"]]],
  [\"if\", \"acct\",
    [\"call-program\", 
      [\"str\", \"upvote\"], 
      [\"lst\", \"site-hash\", \"comment-id\"],
      [\"dict\", 
        [\"str\", \"accounts\"], 
        [\"dict\", 
          [\"str\", \"siteScore\"], \"acct\",
          [\"str\", \"author\"], \"wallet-key\",
          [\"str\", \"systemProgram\"], \"system-program-id\"]]]
    [\"call-program\", 
      [\"str\", \"upvote_new\"], 
      [\"lst\", \"site-hash\", \"comment-id\", \"bump\"],
      [\"dict\", 
        [\"str\", \"accounts\"], 
        [\"dict\", 
          [\"str\", \"siteScore\"], \"acct\",
          [\"str\", \"author\"], \"wallet-key\",
          [\"str\", \"systemProgram\"], \"system-program-id\"]]]]],
\"downvote\":[\"block\"
  [\"set\", [\"lst\", \"acct\", \"bump\"],
            [\"pull-account\", [\"pda\", [\"lst\", [\"str\", \"siteScore\"], \"site-hash\"],
                                         \"program-id\"]]],
  [\"if\", \"acct\",
    [\"call-program\", 
      [\"str\", \"downvote\"], 
      [\"lst\"],
      [\"dict\", 
        [\"str\", \"accounts\"], 
        [\"dict\", 
          [\"str\", \"siteScore\"], \"acct\",
          [\"str\", \"author\"], \"wallet-key\",
          [\"str\", \"systemProgram\"], \"system-program-id\"]]]
    [\"call-program\", 
      [\"str\", \"downvote_new\"], 
      [\"lst\", \"bump\"],
      [\"dict\", 
        [\"str\", \"accounts\"], 
        [\"dict\", 
          [\"str\", \"siteScore\"], \"acct\",
          [\"str\", \"author\"], \"wallet-key\",
          [\"str\", \"systemProgram\"], \"system-program-id\"]]]]]}";

        baseAccount.program = program.to_string();
        baseAccount.bump    = bump;
        Ok(())
    }

    pub fn upvote_new(ctx: Context<UpvoteNew>, site_hash: String, comment_id: [u8; 32], bump: u8) -> ProgramResult {
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;


        let mut init_votes: [u8; 10188]   = [0; 10188];

        for i in 0..32 {
            init_votes[i] = comment_id[i]; }
        
        init_votes[33] = 1;
        
        site_score.site  = site_hash;
        site_score.bump  = bump;
        site_score.votes = init_votes;

        OK() }

    pub fn upvote(ctx: Context<UpvoteNew>, site_hash: String, comment_id: [u8; 32]) -> ProgramResult {
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;

        let blank_comment: [u8; 32]      = [0; 32];
        let mut found_comment             = false;
        
        for i in 0..(10188 / 36) {
            let j = i * 36;
            
            if (site_score.votes[(j)..(j + 32)] == comment_id) {
                msg!("found the comment");
                found_comment           = true;
                let mut current_upvotes = LittleEndian::read_u16(
                    &site_score.votes[(j)..(j + 34)]);
                
                current_upvotes        += 1;
                let upvotes_bytes       = current_upvotes.as_bytes();
                
                site_score.votes[j + 32]      = upvotes_bytes[0];
                site_score.votes[j + 33]      = upvotes_bytes[1]; }
            
            else if (site_score.votes[(j)..(j + 32)] == blank_comment) {
                found_comment = true;
                for k in 0..32 {
                    site_score.votes[j + k]  = comment_id[k];
                    site_score.votes[j + 33] = 1; }}}
                    
        
        site_score.site  = site_hash;
        site_score.bump  = bump;

        OK() }

    pub fn downvote_new(ctx: Context<UpvoteNew>, site_hash: String, comment_id: [u8; 32], bump: u8) -> ProgramResult {
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;


        let mut init_votes: [u8; 10188]   = [0; 10188];

        for i in 0..32 {
            init_votes[i] = comment_id[i]; }
        
        init_votes[35] = 1;
        
        site_score.site  = site_hash;
        site_score.bump  = bump;
        site_score.votes = init_votes;

        OK() }

    pub fn downvote(ctx: Context<UpvoteNew>, site_hash: String, comment_id: [u8; 32]) -> ProgramResult {
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;

        let blank_comment: [u8; 32]      = [0; 32];
        let mut found_comment             = false;
        
        for i in 0..(10188 / 36) {
            let j = i * 36;
            
            if (site_score.votes[(j)..(j + 32)] == comment_id) {
                msg!("found the comment");
                found_comment             = true;
                let mut current_downvotes = LittleEndian::read_u16(
                    &site_score.votes[(j)..(j + 34)]);
                
                current_downvotes        -= 1;
                let downvote_bytes        = current_upvotes.as_bytes();
                
                site_score.votes[j + 34]      = downvotes_bytes[0];
                site_score.votes[j + 35]      = downvotes_bytes[1]; }
            
            else if (site_score.votes[(j)..(j + 32)] == blank_comment) {
                found_comment = true;
                for k in 0..32 {
                    site_score.votes[j + k]  = comment_id[k];
                    site_score.votes[j + 33] = 1; }}}
                            
        site_score.site  = site_hash;
        site_score.bump  = bump;

        OK() }

}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = author, space = 10240, seeds=[b"definition"], bump)]
    pub baseAccount: Box<Account<'info, BaseAccount>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, 
}

#[derive(Accounts)]
#[instruction(site_hash: String, comment_id: String)]
pub struct Upvote<'info> {
    #[account(mut, init, payer=author, space= 10240, seeds=[b"siteScore", site_hash.as_bytes], bump=siteScore.bump)]
    pub siteScore: Box<Account<'info, SiteScore>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]
    pub system_program: AccountInfo<'info>, }

#[derive(Accounts)]
#[instruction(site_hash: String, comment_id: String, bump: u8)]
pub struct UpvoteNew<'info> {
    #[account(mut, seeds=[b"siteScore", site_hash.as_bytes], bump)]
    pub siteScore: Box<Account<'info, SiteScore>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }

#[account]
pub struct SiteScore {
    pub site:   String,
    pub bump:   u8,
    pub votes: [u8; 10188], // 10203
    // <comment id><upvotes(i16)><downvotes(i16)>
}

    // 32 + 4 + 1 

#[account]
pub struct BaseAccount {
    pub program: String,
    pub bump: u8[],
}


impl SiteScore {
    const LEN: usize = 10240;
}
