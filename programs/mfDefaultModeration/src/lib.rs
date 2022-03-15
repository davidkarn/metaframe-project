use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use byteorder::{ByteOrder, LittleEndian}; 

declare_id!("G5M7avXmeBtrML6hAcrJWzhvKTyoGXYtUvvsAWX4E91p");

#[program]
pub mod mf_default_moderation {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        let baseAccount: &mut Account<BaseAccount> = &mut ctx.accounts.baseAccount;
        let program = "{
    \"name\": \"default\",
    \"voting\":\"updown\",
    \"scorer\":[\"block\",
              [\"set\", \"scores\",
               [\"memoize\",
                [\"str-concat\", [\"str\", \"score-acct\"], \"site-hash\"],
                [\"*\", 60, 1000],
                [\"pull-account\", [\"nth\", [\"pda\", [\"lst\", [\"str\", \"siteScore\"],
                                                  \"site-hash\"],
                                          \"program-id\"],
                                  1],
                 \"program\",
                 [\"str\", \"siteScore\"]]]],
              [\"set\", \"this-score\", [\"find-value\", \"scores\", \"comment-id\"]],
              [\"if\", \"this-score\",
               [\"block\",
                [\"set\", \"up\", [\"nth\", \"this-score\", 0]],
                [\"set\", \"down\", [\"nth\", \"this-score\", 1]],
                [\"-\", \"up\", \"down\"]],
               0]],
    \"upvote\":[\"block\",
              [\"set\", [\"addr\", \"bump\"],
               [\"pda\", [\"lst\", [\"str\", \"siteScore\"], \"site-hash\"],
                \"program-id\"]],
              [\"set\", \"acct\",
               [\"pull-account\",
                \"addr\",
                \"program\",
                [\"str\", \"siteScore\"]]],
              [\"if\", \"acct\",
               [\"call-program\",
                \"program\",
                [\"str\", \"upvote\"],
                [\"lst\", \"site-hash\", \"comment-id\"],
                [\"dict\",
                 [\"str\", \"accounts\"],
                 [\"dict\",
                  [\"str\", \"siteScore\"], \"addr\",
                  [\"str\", \"author\"], \"wallet-key\",
                  [\"str\", \"systemProgram\"], \"system-program-id\"]]],
               [\"call-program\",
                \"program\",
                [\"str\", \"upvoteNew\"],
                [\"lst\", \"site-hash\", \"comment-id\", \"bump\"],
                [\"dict\",
                 [\"str\", \"accounts\"],
                 [\"dict\",
                  [\"str\", \"siteScore\"], \"addr\",
                  [\"str\", \"author\"], \"wallet-key\",
                  [\"str\", \"systemProgram\"], \"system-program-id\"]]]]],
    \"downvote\":[\"block\",
                [\"set\", [\"addr\", \"bump\"],
                 [\"pda\", [\"lst\", [\"str\", \"siteScore\"], \"site-hash\"],
                  \"program-id\"]],
                [\"set\", \"acct\",
                 [\"pull-account\",
                  \"addr\",
                  \"program\",
                  [\"str\", \"siteScore\"]]],
                [\"if\", \"acct\",
                 [\"call-program\",
                  \"program\",
                  [\"str\", \"downvote\"],
                  [\"lst\", \"site-hash\", \"comment-id\"],
                  [\"dict\",
                   [\"str\", \"accounts\"],
                   [\"dict\",
                    [\"str\", \"siteScore\"], \"addr\",
                    [\"str\", \"author\"], \"wallet-key\",
                    [\"str\", \"systemProgram\"], \"system-program-id\"]]],
                 [\"call-program\",
                  \"program\",
                  [\"str\", \"downvoteNew\"],
                  [\"lst\", \"site-hash\", \"comment-id\", \"bump\"],
                  [\"dict\",
                   [\"str\", \"accounts\"],
                   [\"dict\",
                    [\"str\", \"siteScore\"], \"addr\",
                    [\"str\", \"author\"], \"wallet-key\",
                    [\"str\", \"systemProgram\"], \"system-program-id\"]]]]]}";

        baseAccount.program = program.to_string();
        baseAccount.bump    = bump;
        Ok(())
    }

    pub fn upvote_new(ctx: Context<UpvoteNew>, site_hash: String, comment_id: String, bump: u8) -> ProgramResult {
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;


        let mut init_votes: Vec<u8> = vec![0; 10084];
        let comment_bytes           = comment_id.as_bytes();

        for i in 0..15 {
            init_votes[i] = comment_bytes[i]; }
        
        init_votes[16] = 1;
        
        site_score.site  = site_hash;
        site_score.bump  = bump;
        site_score.votes = init_votes;

        Ok(()) }

    pub fn upvote(ctx: Context<Upvote>, site_hash: String, comment_id: String) -> ProgramResult {
       msg!("starting");
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;

        let blank_comment: [u8; 15]    = [0; 15];
        let mut found_comment          = false;
        let comment_bytes              = comment_id.as_bytes();
        let mut comment: [u8; 15]      = [0; 15];
msg!("gothere");
        for i in 0..15 { // maybe theres a better way to do this
            comment[i] = comment_bytes[i]; }
        
        for i in 0..(10184 / 19) {
            let j = i * 19;
            msg!("{} {}", j, i);
                
            
            if site_score.votes[(j)..(j + 15)] == comment {
                msg!("found the comment");
                found_comment           = true;
                let mut current_upvotes = LittleEndian::read_u16(
                    &site_score.votes[(j)..(j + 27)]);
                
                current_upvotes        += 1;
                let upvotes_bytes       = current_upvotes.to_le_bytes();
                
                site_score.votes[j + 15]      = upvotes_bytes[0];
                site_score.votes[j + 16]      = upvotes_bytes[1];
                break; }
            
            else if site_score.votes[(j)..(j + 15)] == blank_comment {
                found_comment = true;
                for k in 0..15 {
                    site_score.votes[j + k]  = comment[k];
                    site_score.votes[j + 16] = 1; }

                break;  }}
                    
        
        site_score.site  = site_hash;

        Ok(()) }

    pub fn downvote_new(ctx: Context<DownvoteNew>, site_hash: String, comment_id: String, bump: u8) -> ProgramResult {
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;


        let mut init_votes: Vec<u8> = vec![0; 10084];
        let comment_bytes           = comment_id.as_bytes();

        for i in 0..15 {
            init_votes[i] = comment_bytes[i]; }
        
        init_votes[18] = 1;
        
        site_score.site  = site_hash;
        site_score.bump  = bump;
        site_score.votes = init_votes;

        Ok(()) }

    pub fn downvote(ctx: Context<Downvote>, site_hash: String, comment_id: String) -> ProgramResult {
        let site_score: &mut Account<SiteScore> = &mut ctx.accounts.siteScore;
        let author: &Signer                     = &ctx.accounts.author;


        let blank_comment: [u8; 15]    = [0; 15];
        let mut found_comment          = false;
        let comment_bytes              = comment_id.as_bytes();
        let mut comment: [u8; 15]      = [0; 15];
msg!("gothere");
        for i in 0..15 { // maybe theres a better way to do this
            comment[i] = comment_bytes[i]; }
        
        for i in 0..(10184 / 19) {
            let j = i * 19;
            msg!("{} {}", j, i);
            
            if site_score.votes[(j)..(j + 15)] == comment {
                msg!("found the comment");
                found_comment             = true;
                let mut current_downvotes = LittleEndian::read_u16(
                    &site_score.votes[(j)..(j + 17)]);
                
                current_downvotes        -= 1;
                let downvote_bytes        = current_downvotes.to_le_bytes();
                
                site_score.votes[j + 17]      = downvote_bytes[0];
                site_score.votes[j + 18]      = downvote_bytes[1];
                break; }
            
            else if site_score.votes[(j)..(j + 15)] == blank_comment {
                found_comment = true;
                for k in 0..15 {
                    site_score.votes[j + k]  = comment[k];
                    site_score.votes[j + 18] = 1; }
                break; }}
                            
        site_score.site  = site_hash;

        Ok(()) }

}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer = author, space = 10240, seeds=[b"definition"], bump)]
    pub baseAccount: Box<Account<'info, BaseAccount>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]
    /// CHECK: asdfafs
    pub system_program: AccountInfo<'info>, 
}

#[derive(Accounts)]
#[instruction(site_hash: String, comment_id: String)]
pub struct Upvote<'info> {
    #[account(mut, seeds=[b"siteScore", site_hash.as_bytes()], bump=siteScore.bump)]
    pub siteScore: Box<Account<'info, SiteScore>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]
    /// CHECK: asdfafs
    pub system_program: AccountInfo<'info>, }

#[derive(Accounts)]
#[instruction(site_hash: String, comment_id: String, bump: u8)]
pub struct UpvoteNew<'info> {
    #[account(init, payer=author, space=SiteScore::LEN, seeds=[b"siteScore", site_hash.as_bytes()], bump)]
    pub siteScore: Box<Account<'info, SiteScore>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    /// CHECK: asdfafs
    pub system_program: AccountInfo<'info>, }


#[derive(Accounts)]
#[instruction(site_hash: String, comment_id: String)]
pub struct Downvote<'info> {
    #[account(mut, seeds=[b"siteScore", site_hash.as_bytes()], bump=siteScore.bump)]
    pub siteScore: Box<Account<'info, SiteScore>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]
    /// CHECK: asdfafs
    pub system_program: AccountInfo<'info>, }

#[derive(Accounts)]
#[instruction(site_hash: String, comment_id: String, bump: u8)]
pub struct DownvoteNew<'info> {
    #[account(init, payer=author, space= SiteScore::LEN, seeds=[b"siteScore", site_hash.as_bytes()], bump)]
    pub siteScore: Box<Account<'info, SiteScore>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    /// CHECK: asdfafs
    pub system_program: AccountInfo<'info>, }

#[account]
pub struct SiteScore {
    pub site:   String,
    pub bump:   u8,
    pub votes: Vec<u8>, //; 10188
    // <comment id><upvotes(i16)><downvotes(i16)>, ...
}

    // 32 + 4 + 1 

#[account]
pub struct BaseAccount {
    pub program: String,
    pub bump: u8,
}

impl SiteScore {
    const LEN: usize = 10188 + 8 + 4 + 1;
}
