use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

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
      [\"lst\"],
      [\"dict\", 
        [\"str\", \"accounts\"], 
        [\"dict\", 
          [\"str\", \"siteScore\"], \"acct\",
          [\"str\", \"author\"], \"wallet-key\",
          [\"str\", \"systemProgram\"], \"system-program-id\"]]]
    [\"call-program\", 
      [\"str\", \"upvote_new\"], 
      [\"lst\", \"bump\"],
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

#[account]
pub struct BaseAccount {
    pub program: String,
    pub bump: u8,
}
