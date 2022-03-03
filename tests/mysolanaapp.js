const assert = require("assert");
const anchor = require("@project-serum/anchor");
const { SystemProgram } = anchor.web3;
const web3 = anchor.web3;

describe("mysolanaapp", () => {
    let _baseAccount
    const provider = anchor.Provider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Mysolanaapp;

    it("Creates an index)", async () => {
        const [indexAddr, bump]  = await web3
              .PublicKey
              .findProgramAddress(
                  [Buffer.from("commentsIndex"), Buffer.from("asfkasdf")],
                  program.programId)
        const baseAccount = anchor.web3.Keypair.generate();

        await program.rpc.postComment("ajdlslkfff", "asdfkjasdflff", "asfkasdf", "askldfjalkfsdj", "slkdfjsldj", "lsdfkjslkfdj", bump, {
            accounts: {
                comment: baseAccount.publicKey,
                index: indexAddr,
                author: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [baseAccount],
        });
/*
        const account = await program.account.commentsIndex.fetch(indexAddr.publicKey);
        console.log(account)
        assert.ok(account == null);
        _baseAccount = baseAccount;*/
    });

    it("updates an index)", async () => {
        const [indexAddr, bump]  = await web3
              .PublicKey
              .findProgramAddress(
                  [Buffer.from("commentsIndex"), Buffer.from("asfkasdf")],
                  program.programId)
        const baseAccount = anchor.web3.Keypair.generate();

        await program.rpc.postCommentUpdateIndex("asdfjdlslkfff", "asdfkjasdflffsdfd", "asfkasdf", "askldfjalkfsdj", "slkdfjsldj", "lsdfkjslkfdj", {
            accounts: {
                comment: baseAccount.publicKey,
                index: indexAddr,
                author: provider.wallet.publicKey,
                systemProgram: SystemProgram.programId,
            },
            signers: [baseAccount],
        });
/*        
        const account = await program.account.CommentsIndex.fetch(indexAddr.publicKey);
        console.log(account)
        assert.ok(account == null);
        _baseAccount = baseAccount;*/
    });

    
});
