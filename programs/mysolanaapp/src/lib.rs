use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_program;
use std::convert::TryFrom;

declare_id!("6FFmFrZMQxH3DB2VGwVaAR13tEgvmfyHVwhMVooot9VG");

#[program]
mod mysolanaapp {
    use super::*;

    #[inline(never)]
    pub fn post_reply_update_index(ctx: Context<PostReplyUpdateIndex>, username: String, message: String, to_comment: String) -> ProgramResult {
        let reply: &mut Account<Reply>     = &mut ctx.accounts.reply;
        let index: &mut Account<CommentsIndex>     = &mut ctx.accounts.index;
        let author: &Signer                = &ctx.accounts.author;
        let clock: Clock                   = Clock::get().unwrap();

        reply.author           = *author.key;
        reply.timestamp        = clock.unix_timestamp;
        reply.username         = username;
        reply.message          = message;
        reply.to_comment       = to_comment;

        
        index.reply_count     += 1;
        index.message_ids      = <[u8; 512]>::try_from([&ctx.accounts.reply.key().to_bytes(),
                                                         &index.message_ids[0 .. 512 - 32]].concat().as_slice())
                                                         .unwrap();

        Ok(()) }

    #[inline(never)]
    pub fn post_comment(ctx: Context<PostComment>, username: String, message: String, site: String, path: String, node_hash: String/*, root_node_hash: String*/, selection: String, index_bump: u8) -> ProgramResult {
        msg!("starthere");
        let comment: &mut Account<Comment> = &mut ctx.accounts.comment;
        let index: &mut Account<CommentsIndex>     = &mut ctx.accounts.index;
        let author: &Signer                = &ctx.accounts.author;
        let clock: Clock                   = Clock::get().unwrap();
    
    //        if username.chars().count() > 48 {
    //            return Err(ErrorCode::UsernameTooLong.into()) }
    //        if message.chars().count() > 1024 {
    //            return Err(ErrorCode::CommentTooLong.into()) }
        msg!("nowhere");
        comment.author           = *author.key;
        comment.timestamp        = clock.unix_timestamp;
        comment.username         = username;
        comment.message          = message;
        comment.selection        = selection;
        comment.site             = site;
        comment.path             = path;
        comment.node_hash        = node_hash;
    //        comment.root_node_hash   = root_node_hash;
    
  //      let mut new_ids: [u8; 512]   = [0; 512];
/*        let bytes                    = comment.key().to_bytes();
        let existing_bytes           = index.comment_ids;
            
        for i in 0..511 {
            if (i < 32) {
                new_ids[i] = bytes[i]; }
            else {
                new_ids[i] = existing_bytes[i - 32] }}
  */      
        msg!("indexstuff");
        let replies_zeros: [u8; 512]      = [0; 512];
        let mut zeros: [u8; 512]      = [0; 512];

        let mut i = 0;
        for b in comment.key().to_bytes().iter() {
            zeros[i] = *b;
            i += 1;
        }
        msg!("goingtosetupstuff");
        msg!("site");
        msg!(&comment.site.clone());
        index.site                = comment.site.clone(); //
        index.path                = comment.path.clone();
        msg!("1");
        index.last_message        = comment.timestamp;
        msg!("11");
        index.message_ids         = replies_zeros;
        msg!("2");
        index.reply_count         = 0;
        index.count               = 1;
        msg!("3");
        index.comment_ids         = zeros;
        msg!("4");
        index.bump                = index_bump;
                    
        Ok(()) }




    #[inline(never)]
    pub fn post_comment_update_index(ctx: Context<PostCommentUpdateIndex>, username: String, message: String, site: String, path: String, node_hash: String/*, root_node_hash: String*/, selection: String) -> ProgramResult {
        let comment: &mut Account<Comment> = &mut ctx.accounts.comment;
        let index: &mut Account<CommentsIndex>     = &mut ctx.accounts.index;
        let author: &Signer                = &ctx.accounts.author;
        let clock: Clock                   = Clock::get().unwrap();

//        if username.chars().count() > 48 {
//            return Err(ErrorCode::UsernameTooLong.into()) }
//        if message.chars().count() > 1024 {
//            return Err(ErrorCode::CommentTooLong.into()) }
                
        comment.author           = *author.key;
        comment.timestamp        = clock.unix_timestamp;
        comment.username         = username;
        comment.message          = message;
        comment.selection        = selection;
        comment.site             = site;
        comment.path             = path;
        comment.node_hash        = node_hash;
//        comment.root_node_hash   = root_node_hash;

 /*       let replies_zeros: [u8; 512]      = [0; 512];
        let mut zeros: [u8; 512]      = [0; 512];

        let mut i = 0;
        for b in comment.key().to_bytes().iter() {
            zeros[i] = *b;
            i += 1;
        }*/

        let mut new_ids: [u8; 512]   = [0; 512];
        let bytes                    = comment.key().to_bytes();
        let existing_bytes           = index.comment_ids;
            
        for i in 0..511 {
            if i < 32 {
                new_ids[i] = bytes[i]; }
            else {
                new_ids[i] = existing_bytes[i - 32] }}

        index.count             += 1;
        index.comment_ids        = new_ids;
                
        Ok(()) }}

/*#[derive(Accounts)] this never occurs
pub struct PostReply<'info> {
    #[account(init, payer = author, space = Reply::LEN)]
    pub reply: Account<'info, Reply>,
    #[account(init, seeds = [comment.site.as_ref()], bump, 
            payer = author, space = Index::LEN)]
    pub index: Account<'info, Index>,
    #[account()]
    pub comment: Account<'info, Comment>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }
*/
    
#[derive(Accounts)]
#[instruction(username: String, message: String, to_comment: String)]
pub struct PostReplyUpdateIndex<'info> {
    #[account(init, payer = author, space = Reply::LEN)]
    pub reply: Box<Account<'info, Reply>>,
    #[account(seeds = [comment.site.as_ref()], bump=index.bump, mut)]
    pub index: Box<Account<'info, CommentsIndex>>,
    #[account()]
    pub comment: Box<Account<'info, Comment>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }


#[derive(Accounts)]
#[instruction(username: String, message: String, site: String, path: String, node_hash: String, selection: String, index_bump: u8)]
pub struct PostComment<'info> {
    #[account(init, payer = author, space = Comment::LEN)]
    pub comment: Box<Account<'info, Comment>>,
    #[account(init, seeds = [b"commentsIndex", site.as_bytes()], bump, 
              payer = author, space = CommentsIndex::LEN)]
    pub index: Box<Account<'info, CommentsIndex>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }

#[derive(Accounts)]
#[instruction(username: String, message: String, site: String, path: String, node_hash: String, selection: String)]
pub struct PostCommentUpdateIndex<'info> {
    #[account(init, payer = author, space = Comment::LEN)]
    pub comment: Box<Account<'info, Comment>>,
    #[account(mut, seeds = [b"commentsIndex", site.as_bytes()], bump=index.bump)]
    pub index: Box<Account<'info, CommentsIndex>>,
    #[account(mut)]
    pub author: Signer<'info>,
    #[account(address = system_program::ID)]    
    pub system_program: AccountInfo<'info>, }

#[account]
pub struct CommentsIndex {
    pub site:           String,  // 32
    pub path:           String, // 32
    pub count:          i32, // 4
    pub reply_count:    i32, // 4
    pub last_message:   i64, // 8    
    pub comment_ids:    [u8; 512], // 512
    pub message_ids:    [u8; 512],
    pub bump:            u8, } // 1

#[account]
pub struct CommentsIndexy {
    pub site:           String,  // 32
    pub path:           String, // 32
    pub bump:            u8, } // 1

#[account]
pub struct Reply {
    pub to_comment:     String,
    pub author:         Pubkey,
    pub timestamp:      i64,
    pub username:       String,
    pub message:        String, }

// An account that goes inside a transaction instruction
#[account]
pub struct Comment {
  pub site:           String,
  pub path:           String,
//  pub root_node_hash: String,
  pub node_hash:      String,
  pub author:         Pubkey,
  pub timestamp:      i64,
  pub username:       String,
  pub message:        String, 
  pub selection:      String, }

impl Reply {
    const LEN: usize = 2048; }

impl CommentsIndex {
    const LEN: usize = 4 + 32 + 32 + 4 + 4 + 8 + 512 + 512 + 1; }

impl Comment {
    const LEN: usize = 10240; }

#[error]
pub enum ErrorCode {
    #[msg("The provided username should be 48 characters long maximum.")]
    UsernameTooLong,
    #[msg("The provided comment should be 1024 characters long maximum.")]
    CommentTooLong, }
