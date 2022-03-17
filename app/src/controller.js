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
const definition_key   = "definition"

const App = () => {
    const [value, setValue]       = useState(null)
    const wallet                  = useWallet()
    let connection
    let mod_program_def
    let mod_program_id
    let mod_program
    let mod_program_def_id

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
                          [Buffer.from(definition_key)],
                          mod_program.programId)

                mod_program_def_id = definition
                try {
                    const account     = await mod_program.account.baseAccount.fetch(definition)
                    console.log({account})
                    mod_program_def   = JSON.parse(account.program) }
                catch (e) {
                    console.error('error fetching mod program definition', e) }

                if (!mod_program_def) {
                    initialize_mod_program()
                    setTimeout(
                        async () => {
                            const account     = await mod_program.account.baseAccount.fetch(definition)
                            console.log({account})
                            mod_program_def   = JSON.parse(account.program) },
                        10000) }}) }
    
    function getProvider() {
        const network     = "http://127.0.0.1:8899"
        connection        = new Connection(network, opts.preflightCommitment)

        const provider    = new Provider(
            connection, wallet, opts.preflightCommitment)

        return provider }

    const x         = Math.random();
    const provider  = getProvider();
    const program   = new Program(idl, programID, provider)

    const initialize_mod_program = async () => {
        const [addr, bump]  = await web3
              .PublicKey
              .findProgramAddress(
                  [Buffer.from(definition_key)],
                  mod_program.programId)

        mod_program.rpc.initialize(
            bump,
            {accounts: {
                baseAccount: addr,
                author: provider.wallet.publicKey,
                systemProgram: web3.SystemProgram.programId}}) }

    window.initialize_mod_program = initialize_mod_program

    const score_comment = async (site_hash, comment_id, comment_text) => {
        return await eval_program(
            mod_program_def.scorer,
            {"site-hash":      site_hash,
             "comment-text":   comment_text,
             "comment-id":     comment_id,
             "program":        mod_program,
             "program-id":     mod_program_id}) }

    const memoized_values = {}

    const eval_program = async (program, variables={}) => {
        const result = await eval_program2(program, variables)
        return result }
    
    const eval_program2 = async (program, variables={}) => {
        const fn = program[0]
        let addr, bump
        if (typeof program == "string") {
            if (variables[program] === undefined)
                throw "Variable not defined: '" + program + "'"
            else
                return variables[program] }

        if (typeof program == "number" || typeof program == "boolean")
            return program

        if (program === undefined || program === null)
            return program

        switch (fn) {
        case "block":
            let ret
            for (let i = 1; i < program.length; i++) 
                ret = await eval_program(program[i], variables)
            return ret
            
        case "memoize":
            const mm_name     = await eval_program(program[1], variables)
            const mm_length   = await eval_program(program[2], variables)

            if (memoized_values[mm_name]) {
                if (memoized_values[mm_name].time > new Date())
                    return memoized_values[mm_name].value
                
                else
                    delete memoized_values[mm_name] }

            const value = await eval_program(program[3], variables)
            memoized_values[mm_name] = {value, time: new Date() + mm_length}
            return value 

        case "print":
            let print_res = await eval_program(program[1], variables)
            console.log(print_res)
            return print_res
            
        case "str":
            return program[1]

        case ".":
            const dot_obj = await eval_program(program[1], variables)
            const dot_key = await eval_program(program[2], variables)
            return dot_obj[dot_key]                
            
        case "set":
            const set_result = await eval_program(program[2], variables)

            if (typeof program[1] == 'string')
                variables[program[1]] = set_result
            
            else
                for (var i in program[1])
                    variables[program[1][i]] = set_result[i]
            return set_result

        case "if":
            if (await eval_program(program[1], variables))
                return await eval_program(program[2], variables)
            else if (program.length > 3)
                return await eval_program(program[3], variables)
            else
                return null
            
        case "nth":
            const nth_list = await eval_program(program[1], variables)
            const nth_n    = await eval_program(program[2], variables)
            
            return nth_list[nth_n]

        case "split":
            const split_str = await eval_program(program[1], variables)
            const split_by = await eval_program(program[2], variables)
            return split_str.split(split_by)

        case "replace":
            const replace_search = await eval_program(program[1], variables)
            const replace_with = await eval_program(program[2], variables)
            const replace_str = await eval_program(program[3], variables)
            return replace_str.replace(replace_search, replace_with)

        case "map":
            const map_list  = await eval_program(program[3], variables)
            const map_var   = program[1]
            const map_fn    = program[2]
            const map_res   = []

            for (let map_i in map_list) {
                variables[map_var] = map_list[map_i]
                map_res.push(await eval_program(map_fn, variables)) }

            return map_res
            
        case "regex":
            return new RegExp(await eval_program(program[1], variables))

        case "to-lower":
            const to_lower_str = await eval_program(program[1], variables)
            return to_lower_str.toLowerCase()

        case "str-concat":
            let str_concat_res = ""
            for (let i in program) 
                if (i > 0)
                    str_concat_res += await eval_program(program[i], variables)
            return str_concat_res

        case "len":
            const len_item = await eval_program(program[1], variables)
            return len_item.length
            
        case "range":
            const range_res   = []
            const range_start = await eval_program(program[1], variables)
            const range_end   = await eval_program(program[2], variables)
            
            for (let range_i=range_start; range_i < range_end; range_i++)
                range_res.push(range_i)

            return range_res
            
        case "for":
            const for_var_name  = program[1]
            const for_items     = await eval_program(program[2], variables)
            let for_last_res    = null
            
            for (let for_i in for_items) {
                variables[for_var_name] = for_items[for_i]
                for_last_res = await eval_program(program[3], variables) }
            
            return for_last_res

        case "push":
            let push_list = await eval_program(program[1], variables)
            let push_val  = await eval_program(program[2], variables)

            push_list.push(push_val)
            return push_list

        case "member":
            let member_val   = await eval_program(program[1], variables)
            let member_list  = await eval_program(program[2], variables)

            return member_list.indexOf(member_val) > -1
            
        case "bs58-encode":
            return bs58.encode((await eval_program(program[1], variables))._bn.words)

        case "lst":
            const items = program.slice(1)
            const _lst  = []

            for (let i in items) 
                _lst.push(await eval_program(items[i], variables))
            
            return _lst

        case "to-string":
            return (await eval_program(program[1], variables)).toString()
            break 
            
        case "dict":
            const dict = {}
            for (let i = 1; i < program.length; i += 2) {
                let dict_key = await eval_program(program[i],
                                                  variables)
                let dict_val = await eval_program(program[i + 1],
                                                  variables)

                dict[dict_key] = dict_val }
            return dict

        case "pull-account":
            try {
                mod_program      = await eval_program(program[2], variables)
                let addr         = await eval_program(program[1], variables)
                let account_name = await eval_program(program[3], variables)

                const pulled_account = await mod_program
                    .account[account_name]
                      .fetch(addr)
                
                return pulled_account }
            
            catch (e) {
                return null }
            
        case "call-program":
            let mod_program   = await eval_program(program[1], variables)
            let command       = await eval_program(program[2], variables)
            let args          = await eval_program(program[3], variables)
            let options       = await eval_program(program[4], variables)

            args.push(options)

            return await mod_program.rpc[command].apply(
                mod_program.rpc[command],
                args)
            
        case "find-value":
            //...
            break

        case "pda":
            const pda_params = await eval_program(program[1], variables)
            const pda_prog   = await eval_program(program[2], variables)

            const pda_res    = await web3
                  .PublicKey
                  .findProgramAddress(
                      pda_params
                          .map(Buffer.from),
                      pda_prog)

            return pda_res

        case ">":
            return await eval_program(program[1], variables)
                > await eval_program(program[2], variables)
            
        case "<":
            return await eval_program(program[1], variables)
                < await eval_program(program[2], variables)
            
        case ">=":
            return await eval_program(program[1], variables)
                >= await eval_program(program[2], variables)
            
        case "<=":
            return await eval_program(program[1], variables)
                <= await eval_program(program[2], variables)
            
        case "=":
            return await eval_program(program[1], variables)
                == await eval_program(program[2], variables)

        case "!=":
            return await eval_program(program[1], variables)
                != await eval_program(program[2], variables)
            
        case "!":
            return !(await eval_program(program[1], variables))
            
        case "-":
            return await eval_program(program[1], variables)
                - await eval_program(program[2], variables)

        case "+":
            return await eval_program(program[1], variables)
                + await eval_program(program[2], variables)
            
        case "*":
            return await eval_program(program[1], variables)
                * await eval_program(program[2], variables)
            
        case "/":
            return await eval_program(program[1], variables)
                / await eval_program(program[2], variables)
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
        let watching       
        let watch_listener
        let watching_tab_id
        let watching_path
        let open_comment

        const fetch_comments = (filters) => {
            return program.account.comment.all(filters) }

        const fetch_replies = (filters) => {
            return program.account.reply.all(filters) }

        window.fetch_comments = fetch_comments
        window.fetch_replies  = fetch_replies        
        window.md5            = md5
        window.sol_program    = program
        window.bs58           = bs58
        window.web3           = web3
        window.PublicKey      = PublicKey
        window.provider       = provider

        const update_watching_replies = () => {
            fetch_replies([
                {memcmp: {
                    offset: 8 + 4,
                    bytes: bs58.encode(Buffer.from(open_comment)) }}])

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
                        tab:         watching_tab_id,
                        data:       {command:   'receive_replies',
                                     replies:    replies,
                                     parent_id:  open_comment}}) }) }
        
        const update_watching_comments = () => {
            fetch_comments([
                {memcmp: {
                    offset: 8 + 4,
                    bytes: bs58.encode(Buffer.from(md5(watching)
                                                   /*+ md5(message.path)*/))}}])

                .then(async (comments) => {
                    const scores = {}

                    for (let i in comments) {
                        const comment = comments[i]
                        const id      = bs58.encode(comment.publicKey._bn.words)
                        const score   = await score_comment(comment.site, id, comment.account.message)
                        scores[id]    = score
                        if (scores[id] == -1)
                            delete comments[i] }

                    comments = comments.filter(x => x)

                    send_to_backend({
                        command:    'send-to-tab',
                        tab:         watching_tab_id,
                        data:       {command:     'receive_comments',
                                     comments:  comments,
                                     scores:    scores,
                                     votestyle: mod_program_def.voting,
                                     site:      watching,
                                     path:      watching_path,
                                     tab_id:    watching_tab_id}}) }) }

        const change_watching = async (new_site) => {
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
                    update_watching_comments()
                    update_watching_replies()
                    console.log({account_info, context}) }) }
        
        const message_listener = async (_message) => {
            const message = _message.data
            
            if (message.command == 'request_comments') {
                change_watching(message.site)
                
                watching_tab_id  = message.tab_id
                watching_path    = message.path
                
                update_watching_comments() }

            else if (message.command == 'change_domain') 
                change_watching(message.site)
            
            else if (message.command == 'request_replies') {
                open_comment = message.parent_id
                watching_tab_id = message.tab_id
                update_watching_replies() }

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

            else if (message.command == 'upvote'
                     || message.command == 'downvote') {
                let vote_program = mod_program_def[message.command]
                let parameters     = {
                    "definition-id":     mod_program_def_id,
                    "program-id":        mod_program_id,
                    "program":           mod_program,
                    "comment-id":        message.comment,
                    "site-hash":         message.site,
                    "wallet-key":        provider.wallet.publicKey,
                    "system-program-id": web3.SystemProgram.programId}
                
                await eval_program(vote_program, parameters) }                
        
            else if (message.command == 'post_reply') {
                const reply  = web3.Keypair.generate()

                const [indexAddr, bump]  = await web3
                      .PublicKey
                      .findProgramAddress(
                          [Buffer.from("commentsIndex"), Buffer.from(message.site)],
                          program.programId)

                
                const result = await program.rpc.postReplyUpdateIndex(
                    message.username,
                    message.message,
                    message.to_comment,
                    message.site,
                    {accounts: {author:        provider.wallet.publicKey,
                                index:         indexAddr,
                                reply:         reply.publicKey,
                                systemProgram: web3.SystemProgram.programId},
                     signers: [reply]})
                
                update_watching_replies() }
            
            else if (message.command == 'post_comment'
                     || message.command == 'post_first_comment') {
                const comment            = web3.Keypair.generate()
                const is_subcomment      = message.site == 'metaframe'
                let fnName               = (message.command == 'post_first_comment'
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

                let existing_index
                try {
                    existing_index = await program.account
                        .commentsIndex
                        .fetch(indexAddr)
                } catch (e) {}

                if (!existing_index) 
                    fnName = 'postComment'
                
                let result
                if (fnName == 'postComment')
                    result = await program.rpc.postComment(
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
                else
                    result = await program.rpc[fnName](
                        name,
                        msg,
                        site,
                        path,
                        is_subcomment
                            ? message.node.parent
                            : md5(JSON.stringify(message.node.nodes[message.node.nodes.length - 1])),
                        node,
                        {accounts: {comment:       comment.publicKey,
                                    index:         indexAddr,
                                    author:        provider.wallet.publicKey,
                                    systemProgram: web3.SystemProgram.programId},
                         signers: [comment]})

                
            }}

        send_to_backend({command: 'send_options'})
        
        window.top.addEventListener('message', message_listener)

        return () => {
            window.removeEventListener("message", message_listener) }}
    
    useEffect(init_app, [wallet, web3.SystemProgram.programId])

    if (!wallet.connected) 
        return __('div', {},
                  __(WalletMultiButton)) 

    else 
        return __('div', {style: {padding:    '18px',
                                  fontFamily: 'sans-serif',
                                  textAlign:  'center'}},
                  __('img', {src: 'icon.png', style: {width: '64px',
                                                      display: 'inline-block' }}),
                  __('p', {}, __('strong', {}, 'Metaframe is running')),
                  __('p', {}, "Keep this window open to continue using Metaframe")) }

const AppWithProvider = () => {
    return __(ConnectionProvider, {endpoint: "http://127.0.0.1:8899"},
              __(WalletProvider,  {wallets: wallets, autoConnect: true},
                 __(WalletModalProvider, {},
                    __(App)))) }


ReactDOM.render( 
    __(React.StrictMode, {},
       __(AppWithProvider)),
    document.getElementById('root'))
