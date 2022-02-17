import {useState}                from 'react'
import {Connection, PublicKey}   from '@solana/web3.js'
import {Program, Provider, web3} from '@project-serum/anchor'
import idl                       from '../idl.json'
import __                        from '../jsml.js'
import {normalize_site,
        normalize_site_path,
        query_parameters}        from '../utils.js'


const LeaveComment = ({wallet, provider, program}) => {
    const [name, setName]         = useState('')
    const [message, setMessage]   = useState('')
    let node                      = {}
    let iframe_id                 = query_parameters['iframe_id']

    window.addEventListener('message', (message) => {
        console.log("gotmessage", message)
        if (message.command == 'receive_node' && message.id == iframe_id)
            node = message.node })

    window.top.postMessage({command:  "send_node",
                            id:        iframe_id});
            
    const submitComment            = async () => {
        const site               = normalize_site(window.location.href)
        const path               = normalize_site_path(window.location.href)
        
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:    {command: 'post_comment',
                      name, message, site, path, node}}) }
                                                
    return __('div', {id: 'comment-form'},
              __('input', {type:          'text',
                           placeholder:   'name',
                           value:          name,
                           onChange:      (e) => setName(e.target.value)}),
              
              __('textarea', {placeholder:   'message',
                              value:          message,
                              onChange:      (e) => setMessage(e.target.value)}),

              __('button', {onClick: submitComment},
                 "Post")) }

export default LeaveComment
