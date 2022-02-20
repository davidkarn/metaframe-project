import {useState, useEffect}     from 'react'
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
    const [node, setNode]         = useState({})
    const [href, setHref]         = useState('')
    let iframe_id                 = query_parameters()['id']

    useEffect(
        () => {
            chrome.runtime.onMessage.addListener((message) => {
                console.log("gotmessage", message)
                if (message.command == 'receive_node' && message.id == iframe_id) {
                    setNode(message.node) 
                    setHref(message.href) }})

            chrome.runtime.sendMessage({command:  "send_node",
                                        id:        iframe_id}) },
        [])

    const clean_text = (text) => {
        return text.replace(/[^bcdfghjklmnpqrstvwxyz]+/g, '') }
    
    const clean_node = (node) => {
        if (node.nodes.length == 0)
            node.nodes = [node.root_node]
        
        return {text: node.text,
                nodes: [{...node.nodes[node.nodes.length - 1],
                         text: clean_text(node.nodes[node.nodes.length - 1].text)}],
                root_node: {...node.root_node,
                            text: ''}} }
            
    const submitComment            = async () => {
        const site               = normalize_site(href)
        const path               = normalize_site_path(href)
        
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:    {command: 'post_comment',
                      name, message, site, path, node: clean_node(node)}}) }
                                                
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
