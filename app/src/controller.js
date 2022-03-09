import {useState, useEffect}     from 'react'
import {Connection, PublicKey}   from '@solana/web3.js'
import {Program, Provider,
        web3, BN}                from '@project-serum/anchor'
import bs58                      from 'bs58'
import React                     from 'react'
import ReactDOM                  from 'react-dom'
import md5                       from 'js-md5'
import {HashRouter,
        Route,
        Routes}                  from "react-router-dom"
import {PhantomWalletAdapter}    from '@solana/wallet-adapter-wallets'
import {useWallet, WalletProvider,
        ConnectionProvider}      from '@solana/wallet-adapter-react'
import {WalletModalProvider,
        WalletMultiButton}       from '@solana/wallet-adapter-react-ui'
import idl                       from './idl.json'
import __                        from './jsml.js'

require('@solana/wallet-adapter-react-ui/styles.css')

const wallets          = [new PhantomWalletAdapter()]
const {SystemProgram,
       Keypair}        = web3
const opts             = {preflightCommitment: "processed"}
const programID        = new PublicKey(idl.metadata.address)

const App = () => {
    const [value, setValue]       = useState(null)
    const wallet                  = useWallet()
    let connection
    let mod_program_def
    let mod_program_id
    let mod_program

    async function get_mod_program(address) {
        if (address)
            fetch(address)
            .then(x => x.json())
            .then(async mod_idl => {
                mod_program_id            = new PublicKey(mod_idl.metadata.address)
                mod_program               = new Program(mod_idl, mod_program_id, provider)
                window.mod_program        = mod_program

                const [definition, bump]  = await web3
                      .PublicKey
                      .findProgramAddress(
                          [Buffer.from("definition")],
                          mod_program.programId)
                
                const account     = mod_program.account.baseAccount.fetch(indexAddr)
                mod_program_def   = JSON.parse(account.program) }) }

    function getProvider() {
        const network     = "http://127.0.0.1:8899"
        connection        = new Connection(network, opts.preflightCommitment)

        const provider    = new Provider(
            connection, wallet, opts.preflightCommitment)

        return provider }

    const x         = Math.random();
    console.log({x})
    const provider  = getProvider();
    const program   = new Program(idl, programID, provider);

    
    const eval_program = async (program, variables={}) => {
        const fn = eval_program[0]

        if (typeof program == "string")
            return variables[program]

        switch (fn) {
        case "block":
            let ret
            for (let i = 1; i < program.length; i++) 
                ret = eval_program(program[i], variables)
            return ret;

        case "str":
            return program[1]

        case "set":
            variables[program[1]] = eval_program(program.slice(2), variables);
            return variables[program[1]]

        case "if":
            if (eval_program(program[1], variables))
                return eval_program(program[2], variables)
            else
                return eval_program(program[3], variables)

        case "nth":
            return eval_program(program[1])[program[2]]

        case "lst":
            return program.slice(1)
                .map(
                    x => eval_program(x, variables))

        case "dict":
            const dict = {}
            for (let i = 1; i < program.length; i++) 
                dict[eval_program(program[i],
                                  variables)] = eval_program(program[i + 1],
                                                             variables)
            return dict

        case "pull-account":
            let mod_program  = eval_program(program[2], variables)
            let addr         = eval_program(program[1], variables)
            let account_name = eval_program(program[3], variables)

            return mod_program
                .account[account_name]
                .fetch(addr)
            
        case "call-program":
            let mod_program   = eval_program(program[1], variables)
            let command       = eval_program(program[2], variables)
            let args          = eval_program(program[3], variables)
            let options       = eval_program(program[4], variables)

            args.push(options)
            
            return await mod_program.rpc[command].apply(
                mod_program.rpc[command],
                args)
            
        case "find-value":
            //...
            break

        case "pda":
            const [addr, bump]  = await web3
                .PublicKey
                .findProgramAddress(
                    eval_program(program[1], variables)
                        .map(x => Buffer.from(x)),
                    eval_program(program[2], variables))
            return [addr, bump]
        }

        return null;
    }
            

    const send_to_worker = (message) => {
        window.top.postMessage({command: forward_to_worker,
                                message: message}) }
    
    const send_to_backend = (message) => {
        window.top.postMessage({command: 'forward_to_backend',
                                data:     message}) }
    
    const init_app = () => {
        console.log('initing app')
        let watching       
        let watch_listener

        const fetch_comments = (filters) => {
            console.log('fetching', filters)
            return program.account.comment.all(filters) }

        const fetch_replies = (filters) => {
            console.log('fetching', filters)
            return program.account.reply.all(filters) }

        window.fetch_comments = fetch_comments
        window.fetch_replies  = fetch_replies        
        window.md5            = md5
        window.sol_program    = program
        window.bs58           = bs58
        window.web3           = web3
        window.PublicKey      = PublicKey
        window.provider       = provider

        const change_watching = async (new_site) => {
            new_site = new_site.toLowerCase();
            if (new_site == watching) return

            if (watch_listener)
                connection.removeAccountChangeListener(watch_listener)

            watching                  = new_site
            const key                 = md5(new_site)
            const [indexAddr, bump]   = await web3
                  .PublicKey
                  .findProgramAddress(
                      [Buffer.from("commentsIndex"), Buffer.from(key)],
                      program.programId)

            watch_listener = connection.onAccountChange(
                indexAddr,
                (account_info, context) => {
                    console.log({account_info, context}) }) }
        
        const message_listener = async (_message) => {
            const message = _message.data
            console.log('got a message', message.command, message)
            
            if (message.command == 'request_comments') {
                change_watching(message.site)
                
                fetch_comments([
                    {memcmp: {
                        offset: 8 + 4,
                        bytes: bs58.encode(Buffer.from(md5(message.site)
                                                       /*+ md5(message.path)*/))}}])

                    .then(comments => {
                        console.log('fetched', comments)
                        send_to_backend({command:  'forward_comments',
                                         comments:  comments,
                                         site:      message.site,
                                         path:      message.path,
                                         tab_id:    message.tab_id}) }) }

            else if (message.command == 'change_domain') 
                change_watching(message.site)
            
            else if (message.command == 'request_replies') {
                fetch_replies([
                    {memcmp: {
                        offset: 8 + 4,
                        bytes: bs58.encode(Buffer.from(message.parent_id)) }}])

                    .then(replies => {
                        replies = replies.map(r => {
                            return {parent_id: r.account.to_comment,
                                    author:    r.account.author,
                                    username:  r.account.username,
                                    id:        r.publicKey.toString(),
                                    message:   r.account.message,
                                    timestamp: new Date(r.account.timestamp * 1000)} })
                        
                        send_to_backend({
                            command:    'send-to-tab',
                            tab:         message.tab_id,
                            data:       {command:   'receive_replies',
                                         replies:    replies,
                                         parent_id:  message.parent_id}}) }) }

            else if (message.command == 'request_subcomments') {
                fetch_comments([
                    {memcmp: {
                        offset: 8 + 4,
                        bytes: bs58.encode(Buffer.from(md5("metaframe")))}},
                    {memcmp:{
                        offset: 8 + 4 + 32 + 4 + 32 + 4,
                        bytes: bs58.encode(Buffer.from(message.root_id))}}])

                    .then(subcomments => {
                        subcomments = subcomments.map(r => {
                            return {root_id:   message.root_id,
                                    parent_id: r.account.path,
                                    author:    r.account.author,
                                    username:  r.account.username,
                                    id:        r.publicKey.toString(),
                                    selection: JSON.parse(r.account.selection),
                                    message:   r.account.message,
                                    timestamp: new Date(r.account.timestamp * 1000)} })
                        
                        send_to_backend({
                            command:    'send-to-tab',
                            tab:         message.tab_id,
                            data:       {command:     'receive_subcomments',
                                         subcomments:  subcomments,
                                         root_id:      message.root_id}}) }) }

            else if (message.command == 'send_options')
                get_mod_program(message.idl_address)

            else if (message.command == 'post_reply') {
                const reply  = web3.Keypair.generate()

                const [indexAddr, bump]  = await web3
                      .PublicKey
                      .findProgramAddress(
                          [Buffer.from("commentsIndex"), Buffer.from(message.site)],
                          program.programId)

                
                const result = program.rpc.postReplyUpdateIndex(
                    message.username,
                    message.message,
                    message.to_comment,
                    message.site,
                    {accounts: {author:        provider.wallet.publicKey,
                                index:         indexAddr,
                                reply:         reply.publicKey,
                                systemProgram: web3.SystemProgram.programId},
                     signers: [reply]}) }
            
            else if (message.command == 'post_comment'
                     || message.command == 'post_first_comment') {
                const comment            = web3.Keypair.generate()
                const is_subcomment      = message.site == 'metaframe'
                const fnName             = (message.command == 'post_first_comment'
                                            ? 'postComment'
                                            : 'postCommentUpdateIndex')

                const node_hash = is_subcomment
                      ? message.node.parent
                      : md5(JSON.stringify(
                          message.node.nodes[message.node.nodes.length - 1]))
                const node      = JSON.stringify(message.node)
                const name      = message.name
                const site      = md5(message.site)
                const path      = md5(message.path)
                const msg       = message.message


                const [indexAddr, bump]  = await web3
                      .PublicKey
                      .findProgramAddress(
                          [Buffer.from("commentsIndex"), Buffer.from(site)],
                          program.programId)

                console.log([name,
                        msg,
                        site,
                        path,
                        node_hash,
                        node,
                        bump],
                        {accounts: {comment:       comment.publicKey,
                                    index:         indexAddr,
                                    author:        provider.wallet.publicKey,
                                    systemProgram: SystemProgram.programId},
                         signers: [comment]})

                let result
                if (fnName == 'postComment')
                    result = program.rpc.postComment(
                        name,
                        msg,
                        site,
                        path,
                        node_hash,
                        node,
                        bump,
                        {accounts: {comment:       comment.publicKey,
                                    index:         indexAddr,
                                    author:        provider.wallet.publicKey,
                                    systemProgram: SystemProgram.programId},
                         signers: [comment]})
                else (false)
                    result = program.rpc[fnName](
                        message.name,
                        message.message,
                        md5(message.site),
                        md5(message.path),
                        is_subcomment
                            ? message.node.parent
                            : md5(JSON.stringify(message.node.nodes[message.node.nodes.length - 1])),
                        JSON.stringify(message.node),
                        {accounts: {comment:       comment.publicKey,
                                    index:         indexAddr,
                                    author:        provider.wallet.publicKey,
                                    systemProgram: web3.SystemProgram.programId},
                         signers: [comment]})
        
                console.log({result}) }

            console.log('gotmessageinifrmae', message) }

        send_to_backend({command: 'send_options'})
        
        window.top.addEventListener('message', message_listener)

        return () => {
            window.removeEventListener("message", message_listener) }}
    
    useEffect(init_app, [wallet, web3.SystemProgram.programId])

    if (!wallet.connected) 
        return __('div', {},
                  __(WalletMultiButton)) 

    else 
        return __('div', {}, 'Metaframe') }

const AppWithProvider = () => {
    return __(ConnectionProvider, {endpoint: "http://127.0.0.1:8899"},
              __(WalletProvider,  {wallets: wallets, autoConnect: true},
                 __(WalletModalProvider, {},
                    __(App)))) }


ReactDOM.render( 
    __(React.StrictMode, {},
       __(AppWithProvider)),
    document.getElementById('root'))
