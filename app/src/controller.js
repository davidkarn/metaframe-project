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

        window.fetch_comments = fetch_comments
        window.md5 = md5
        
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
                    
            else if (message.command == 'post_comment') {
                console.log('posting', message)
                const comment            = web3.Keypair.generate()

                console.log({wallet, comment, message, x})
                console.log('site', message.site, md5(message.site))
                console.log(message.name,
                    message.message,
                    md5(message.site),
                    md5(message.path),
                    md5(JSON.stringify(message.node.nodes[message.node.nodes.length - 1])),
//                    md5(JSON.stringify(message.node.root_node)),
                    JSON.stringify(message.node),
                    {accounts: {author:        provider.wallet.publicKey,
                                comment:       comment.publicKey,
                                systemProgram: web3.SystemProgram.programId},
                     signers: [comment]})
                const result = program.rpc.postComment(
                    message.name,
                    message.message,
                    md5(message.site),
                    md5(message.path),
                    md5(JSON.stringify(message.node.nodes[message.node.nodes.length - 1])),
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
