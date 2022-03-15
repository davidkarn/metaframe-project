use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("3MNoKDB3fqwZLmVaHyEV6S2YuW4bQqhyPw8KoqUTZMXb");

//const PAYERID = "BR41vU5K6NsB2WmJCLPEVDQvZxWPGAMZDhh44o7NoCj5"; not needed?

#[program]
pub mod mf_moderation {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        let baseAccount: &mut Account<BaseAccount> = &mut ctx.accounts.baseAccount;
        let program = "
{\"name\":\"vote program 2\",
\"voting\":\"updown\",
\"scorer\":[\"block\",
    [\"set\", [\"acct\", \"bump\"], 
        [\"pda\", [\"lst\", [\"str\", \"votes\"], 
                            \"comment-id\"], 
                       \"program-id\"]],
  [\"set\", \"scores\", 
    [\"pull-account\", \"acct\", 
                       \"program\", 
                       [\"str\", \"Votes\"]]],
  [\"if\", \"scores\",
   [\"block\",
    [\"set\", \"up\", [\".\", \"scores\", \"up_count\"]],
    [\"set\", \"down\", [\".\", \"scores\", \"down_count\"]],
    [\"-\", \"up\", \"down\"]],
   0]],
\"upvote\":[\"block\",
  [\"set\", [\"vote-addr\", \"vote-bump\"],
            [\"pda\", [\"lst\", [\"str\", \"votes\"], [\"to-string\", \"wallet-key\"], \"comment-id\"],
                      \"program-id\"]],
  [\"set\", [\"votes-addr\", \"votes-bump\"],
            [\"pda\", [\"lst\", [\"str\", \"votes\"], \"comment-id\"],
                      \"program-id\"]],
  [\"set\", \"acct\",
     [\"pull-account\", \"votes-addr\", \"program\", [\"str\", \"votes\"]]],
  [\"if\", \"acct\",
   [\"call-program\", 
    [\"str\", \"upvote\"],
    [\"lst\", \"comment-id\", \"wallet-key\", \"vote-bump\"],
    [\"dict\",
      [\"str\", \"accounts\"],
      [\"dict\",
       [\"str\", \"vote\"], \"vote-addr\",
       [\"str\", \"votes\"], \"votes-addr\",
       [\"str\", \"author\"], \"wallet-key\",
       [\"str\", \"voteProgram\"], \"program-id\",
       [\"str\", \"systemProgram\"], \"system-program-id\"]]],
   [\"call-program\", 
    [\"str\", \"upvoteNew\"],
    [\"lst\", \"comment-id\", \"wallet-key\", \"vote-bump\", \"votes-bump\"],
    [\"dict\",
      [\"str\", \"accounts\"],
      [\"dict\",
       [\"str\", \"vote\"], \"vote-addr\",
       [\"str\", \"votes\"], \"votes-addr\",
       [\"str\", \"author\"], \"wallet-key\",
       [\"str\", \"voteProgram\"], \"program-id\",
       [\"str\", \"systemProgram\"], \"system-program-id\"]]]]],
\"downvote\":[\"block\",
  [\"set\", [\"vote-addr\", \"vote-bump\"],
            [\"pda\", [\"lst\", [\"str\", \"votes\"], [\"to-string\", \"wallet-key\"], \"comment-id\"],
                      \"program-id\"]],
  [\"set\", [\"lst\", \"votes-addr\", \"votes-bump\"],
            [\"pda\", [\"lst\", [\"str\", \"votes\"], \"comment-id\"],
                      \"program-id\"]],
  [\"set\", \"acct\",
     [\"pull-account\", \"votes-addr\", \"program\", [\"str\", \"votes\"]]],
  [\"if\", \"acct\",
   [\"call-program\", 
    [\"str\", \"downvote\"],
    [\"lst\", \"comment-id\", \"wallet-key\", \"vote-bump\"],
    [\"dict\",
      [\"str\", \"accounts\"],
      [\"dict\",
       [\"str\", \"vote\"], \"vote-addr\",
       [\"str\", \"votes\"], \"votes-addr\",
       [\"str\", \"author\"], \"wallet-key\",
       [\"str\", \"voteProgram\"], \"program-id\",
       [\"str\", \"systemProgram\"], \"system-program-id\"]]],
   [\"call-program\", 
    [\"str\", \"downvoteNew\"],
    [\"lst\", \"comment-id\", \"wallet-key\", \"vote-bump\", \"votes-bump\"],
    [\"dict\",
      [\"str\", \"accounts\"],
      [\"dict\",
       [\"str\", \"vote\"], \"vote-addr\",
       [\"str\", \"votes\"], \"votes-addr\",
       [\"str\", \"author\"], \"wallet-key\",
       [\"str\", \"voteProgram\"], \"program-id\",
       [\"str\", \"systemProgram\"], \"system-program-id\"]]]]]}";

        baseAccount.program = program.to_string();
        baseAccount.bump    = bump;
        Ok(())
    }


    pub fn upvote(ctx: Context<Upvote>, comment_id: String, voter: String, vote_bump: u8) -> ProgramResult {
        let vote: &mut Account<Vote>   = &mut ctx.accounts.vote;
        let votes: &mut Account<Votes> = &mut ctx.accounts.votes;
        let author: &Signer            = &ctx.accounts.author;

        vote.voter      = voter;
        vote.comment_id = comment_id;
        vote.bump       = vote_bump;
        vote.direction  = true;

        votes.up_count += 1;
        
        Ok(()) }

    pub fn downvote(ctx: Context<Downvote>, comment_id: String, voter: String, vote_bump: u8) -> ProgramResult {
        let vote: &mut Account<Vote>   = &mut ctx.accounts.vote;
        let votes: &mut Account<Votes> = &mut ctx.accounts.votes;
        let author: &Signer            = &ctx.accounts.author;

        vote.voter      = voter;
        vote.comment_id = comment_id;
        vote.bump       = vote_bump;
        vote.direction  = true;

        votes.down_count += 1;
        
        Ok(()) }

    pub fn upvote_new(ctx: Context<UpvoteNew>, comment_id: String, voter: String, vote_bump: u8, votes_bump: u8) -> ProgramResult {
        let vote: &mut Account<Vote>   = &mut ctx.accounts.vote;
        let votes: &mut Account<Votes> = &mut ctx.accounts.votes;
        let author: &Signer            = &ctx.accounts.author;

        vote.voter      = voter;
        vote.comment_id = comment_id.clone();
        vote.bump       = vote_bump;
        vote.direction  = true;

        votes.up_count   += 1;
        votes.bump        = votes_bump;
        votes.comment_id  = comment_id.clone();
        votes.up_count    = 1;
        votes.down_count  = 0;
        
        Ok(()) }

    pub fn downvote_new(ctx: Context<DownvoteNew>, comment_id: String, voter: String, vote_bump: u8, votes_bump: u8) -> ProgramResult {
        let vote: &mut Account<Vote>   = &mut ctx.accounts.vote;
        let votes: &mut Account<Votes> = &mut ctx.accounts.votes;
        let author: &Signer            = &ctx.accounts.author;
        
        vote.voter      = voter;
        vote.comment_id = comment_id.clone();
        vote.bump       = vote_bump;
        vote.direction  = true;

        votes.up_count   += 1;
        votes.bump        = votes_bump;
        votes.comment_id  = comment_id.clone();
        votes.up_count    = 0;
        votes.down_count  = 1;
        
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
#[instruction(comment_id: String, voter: String, vote_bump: u8, votes_bump: u8)]
pub struct UpvoteNew<'info> {
    #[account(init, payer=author, space=Vote::LEN,
              seeds=[b"vote", voter.as_bytes(), comment_id.as_bytes()], bump)]
    pub vote: Account<'info, Vote>,
    #[account(init, payer=author, space=Votes::LEN,
              seeds=[b"votes", comment_id.as_bytes()], bump)]
    pub votes: Account<'info, Votes>,
    #[account(mut)]
    pub author: Signer<'info>,
//    #[account(mut)]
//    pub vote_program: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }

#[derive(Accounts)]
#[instruction(comment_id: String, voter: String, vote_bump: u8, votes_bump: u8)]
pub struct DownvoteNew<'info> {
    #[account(init, payer=author, space=Vote::LEN,
              seeds=[b"vote", voter.as_bytes(), comment_id.as_bytes()], bump)]
    pub vote: Account<'info, Vote>,
    #[account(init, payer=vote_program, space=Votes::LEN,
              seeds=[b"votes", comment_id.as_bytes()], bump)]
    pub votes: Account<'info, Votes>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(mut)]
    pub vote_program: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }


#[derive(Accounts)]
#[instruction(comment_id: String, voter: String, vote_bump: u8)]
pub struct Upvote<'info> {
    #[account(init, payer=author, space=Vote::LEN,
              seeds=[b"vote", voter.as_bytes(), comment_id.as_bytes()], bump)]
    pub vote: Account<'info, Vote>,
    #[account(mut, seeds=[b"votes", comment_id.as_bytes()], bump=votes.bump)]
    pub votes: Account<'info, Votes>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(mut)]
    pub vote_program: Signer<'info>, 
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }

#[derive(Accounts)]
#[instruction(comment_id: String, voter: String, vote_bump: u8)]
pub struct Downvote<'info> {
    #[account(init, payer=author, space=Vote::LEN,
              seeds=[b"vote", voter.as_bytes(), comment_id.as_bytes()], bump)]
    pub vote: Account<'info, Vote>,
    #[account(mut, seeds=[b"votes", comment_id.as_bytes()], bump=votes.bump)]
    pub votes: Account<'info, Votes>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(mut)]
    pub vote_program: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }



#[account]
pub struct BaseAccount {
    pub program: String,
    pub bump: u8,
}

#[account]
pub struct Vote {
    pub comment_id: String,
    pub voter: String,
    pub bump: u8,
    pub direction: bool,
}

#[account]
pub struct Votes {
    pub comment_id: String,
    pub bump: u8,
    pub up_count: i16,
    pub down_count: i16,
}

impl Vote {
    const LEN: usize = 8 + 32 + 4 + 32 + 4 + 1 + 2 + 2;
}

impl Votes {
    const LEN: usize = 8 + 32 + 4 + 1 + 2 + 2;
}

