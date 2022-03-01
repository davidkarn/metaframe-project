import {useState, useEffect}     from 'react'
import {Connection, PublicKey}   from '@solana/web3.js'
import {Program, Provider, web3} from '@project-serum/anchor'
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
    const [value, setValue] = useState(null)
    const wallet            = useWallet()

    function getProvider() {
        const network     = "http://127.0.0.1:8899"
        const connection  = new Connection(network, opts.preflightCommitment)

        const provider    = new Provider(
            connection, wallet, opts.preflightCommitment)

        return provider }

    const x         = Math.random();
    console.log({x})
    const provider  = getProvider();
    const program   = new Program(idl, programID, provider);

    const send_to_worker = (message) => {
        window.top.postMessage({command: forward_to_worker,
                                message: message}) }
    
    const send_to_backend = (message) => {
        window.top.postMessage({command: 'forward_to_backend',
                                data:     message}) }
    
    const init_app = () => {
        console.log('initing app')

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
        
        const message_listener = (_message) => {
            const message = _message.data
            console.log('got a message', message.command, message)
            
            if (message.command == 'request_comments') {
                
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
            
            if (message.command == 'request_replies') {
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

            else if (message.command == 'post_reply') {
                const reply  = web3.Keypair.generate()

                const result = program.rpc.postReply(
                    message.username,
                    message.message,
                    message.to_comment,
                    {accounts: {author:        provider.wallet.publicKey,
                                reply:         reply.publicKey,
                                systemProgram: web3.SystemProgram.programId},
                     signers: [reply]}) }
            
            else if (message.command == 'post_comment') {
                const comment            = web3.Keypair.generate()
                const is_subcomment      = message.site == 'metaframe'

                const result = program.rpc.postComment(
                    message.name,
                    message.message,
                    md5(message.site),
                    md5(message.path),
                    is_subcomment
                        ? message.node.parent
                        : md5(JSON.stringify(message.node.nodes[message.node.nodes.length - 1])),
//                    md5(JSON.stringify(message.node.root_node)),
                    JSON.stringify(message.node),
                    {accounts: {author:        provider.wallet.publicKey,
                                comment:       comment.publicKey,
                                systemProgram: web3.SystemProgram.programId},
                     signers: [comment]})
        
                console.log({result}) }

            console.log('gotmessageinifrmae', message) }

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
