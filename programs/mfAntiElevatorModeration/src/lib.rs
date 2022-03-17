use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;

declare_id!("HBTdrDSDHYiB3D2DUxNGwy71iK7H1PHrwys8VuwajpWZ");

#[program]
pub mod mf_anti_elevator_moderation {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, bump: u8) -> ProgramResult {
        let baseAccount: &mut Account<BaseAccount> = &mut ctx.accounts.baseAccount;
        let program = " {
 \"name\":\"anti-elevator moderation\",
 \"description\":\"discussion of elevators is harmful to society and we will censor it for the good of humanity\",
 \"voting\":\"novoting\",
 \"scorer\":[\"block\",
           [\"set\", \"tokenized\",
            [\"map\",
             \"word\",
             [\"replace\", [\"regex\", [\"str\", \"(s|ing|y|ize|ized|ish|ey)$\"]], [\"str\", \"\"],
              [\"replace\", [\"regex\", [\"str\", \"^(pre|post|un|meta|contra|eco|geo|bio)-?$\"]], [\"str\", \"\"], \"word\"]],
             [\"split\", [\"to-lower\", \"comment-text\"], [\"regex\", [\"str\", \"\\\\W+\"]]]]],
           [\"set\", \"banned-words\", [\"lst\", [\"str\", \"escalator\"], [\"str\", \"balustrade\"], [\"str\", \"handrail\"], [\"str\", \"chairlift\"]]],
           [\"set\", \"banned-phrases\", [\"lst\", [\"str\", \"skirt panel\"], [\"str\", \"landing platform\"], [\"str\", \"multiple parallel\"], [\"str\", \"moving walkway\"]]],
           [\"set\", \"phrases-list\", [\"lst\"]],
           [\"for\", \"i\", [\"range\", 0, [\"len\", \"tokenized\"]],
            [\"push\", \"phrases-list\", [\"str-concat\",
                                      [\"nth\", \"tokenized\", \"i\"],
                                      [\"str\", \" \"],
                                      [\"nth\", \"tokenized\", [\"+\", \"i\", 1]]]]],
           [\"set\", \"passed\", true],
           [\"for\", \"word\", \"banned-words\",
            [\"if\", [\"member\", \"word\", \"tokenized\"],
             [\"set\", \"passed\", false]]],
           [\"for\", \"phrase\", \"banned-phrases\",
            [\"if\", [\"member\", \"phrase\", \"phrases-list\"],
             [\"set\", \"passed\", false]]],
           [\"if\", \"passed\",
            1, 
            -1]]}";

        baseAccount.program = program.to_string();
        baseAccount.bump    = bump;
        Ok(())
}
    
    pub fn update(ctx: Context<Update>) -> ProgramResult {
        let baseAccount: &mut Account<BaseAccount> = &mut ctx.accounts.baseAccount;
        let program = " {
 \"name\":\"anti-elevator moderation\",
 \"description\":\"discussion of elevators is harmful to society and we will censor it for the good of humanity\",
 \"voting\":\"novoting\",
 \"scorer\":[\"block\",
           [\"set\", \"tokenized\",
            [\"map\",
             \"word\",
             [\"replace\", [\"regex\", [\"str\", \"(s|ing|y|ize|ized|ish|ey)$\"]], [\"str\", \"\"],
              [\"replace\", [\"regex\", [\"str\", \"^(pre|post|un|meta|contra|eco|geo|bio)-?$\"]], [\"str\", \"\"], \"word\"]],
             [\"split\", [\"to-lower\", \"comment-text\"], [\"regex\", [\"str\", \"\\\\W+\"]]]]],
           [\"set\", \"banned-words\", [\"lst\", [\"str\", \"escalator\"], [\"str\", \"balustrade\"], [\"str\", \"handrail\"], [\"str\", \"chairlift\"]]],
           [\"set\", \"banned-phrases\", [\"lst\", [\"str\", \"skirt panel\"], [\"str\", \"landing platform\"], [\"str\", \"multiple parallel\"], [\"str\", \"moving walkway\"]]],
           [\"set\", \"phrases-list\", [\"lst\"]],
           [\"for\", \"i\", [\"range\", 0, [\"len\", \"tokenized\"]],
            [\"push\", \"phrases-list\", [\"str-concat\",
                                      [\"nth\", \"tokenized\", \"i\"],
                                      [\"str\", \" \"],
                                      [\"nth\", \"tokenized\", [\"+\", \"i\", 1]]]]],
           [\"set\", \"passed\", true],
           [\"for\", \"word\", \"banned-words\",
            [\"if\", [\"member\", \"word\", \"tokenized\"],
             [\"set\", \"passed\", false]]],
           [\"for\", \"phrase\", \"banned-phrases\",
            [\"if\", [\"member\", \"phrase\", \"phrases-list\"],
             [\"set\", \"passed\", false]]],
           [\"if\", \"passed\",
            1, 
            -1]]}";

        baseAccount.program = program.to_string();
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
    /// CHECK: asdfafs
    pub system_program: AccountInfo<'info>, 
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut, seeds=[b"definition"], bump=baseAccount.bump)]
    pub baseAccount: Box<Account<'info, BaseAccount>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]
    /// CHECK: asdfafs
    pub system_program: AccountInfo<'info>, 
}

#[account]
pub struct BaseAccount {
    pub program: String,
    pub bump: u8,
}
