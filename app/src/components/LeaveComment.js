import {useState, useEffect}     from 'react'
import {Connection, PublicKey}   from '@solana/web3.js'
import {Program, Provider, web3} from '@project-serum/anchor'
import idl                       from '../idl.json'
import __                        from '../jsml.js'
import {normalize_site,
        normalize_site_path,
        clean_text,
        query_parameters}        from '../utils.js'


const LeaveComment = ({wallet, provider, program}) => {
    const [name, setName]         = useState('')
    const [message, setMessage]   = useState('')
    const [node, setNode]         = useState({})
    const [href, setHref]         = useState('')
    let iframe_id                 = query_parameters()['id']
    let existing_count            = parseInt(query_parameters()['existing_count'])

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

    const clean_node = (node) => {
        if (node.nodes.length == 0)
            node.nodes = [node.root_node]
        
        return {text: node.text,
                nodes: [{...node.nodes[node.nodes.length - 1],
                         text: clean_text(node.nodes[node.nodes.length - 1].text)}],
                root_node: {...node.root_node,
                            text: ''}} }
            
    const submitComment            = async () => {
        const site          = normalize_site(href)
        const path          = normalize_site_path(href)
        const command       = existing_count > 0 ? 'post_comment' : 'post_first_comment'
        
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:    {command,
                      name,
                      message,
                      site,
                      path,
                      node: clean_node(node)}})

        chrome.runtime.sendMessage(
            {command: 'send-to-tab',
             data:    {command: 'close-window'}}) }

    const close = () => {
        chrome.runtime.sendMessage(
            {command: 'send-to-tab',
             data:    {command: 'close-window',
                       id:      'comment-' + iframe_id}}) }

                                                
    return __('div', {id: 'comment-form', className: 'leave-comment-form'},
              __('input', {type:          'text',
                           placeholder:   'name',
                           value:          name,
                           className:     'form-control',
                           onChange:      (e) => setName(e.target.value)}),
              
              __('textarea', {placeholder:   'message',
                              className:     'form-control',
                              style:       {height: 'calc(100vh - 124px)'},
                              value:          message,
                              onChange:      (e) => setMessage(e.target.value)}),
              __('div', {style: {}}, 
                 __('button', {onClick: submitComment, className: 'submit-btn'},
                    "Post Comment"),
                 " ",
                 __('span', {className: 'text-btn',
                             onClick:    close}, "Cancel"))) }

export default LeaveComment
