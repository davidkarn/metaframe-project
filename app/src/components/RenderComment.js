import {useState, useEffect}     from 'react'
import {Connection, PublicKey}   from '@solana/web3.js'
import {Program, Provider, web3} from '@project-serum/anchor'
import idl                       from '../idl.json'
import __                        from '../jsml.js'
import {normalize_site,
        normalize_site_path,
        clean_text,
        query_parameters}        from '../utils.js'


const RenderComment = ({wallet, provider, program}) => {
    const [comment, setComment]   = useState(false)
    let iframe_id                 = query_parameters()['id']

    useEffect(
        () => {
            chrome.runtime.onMessage.addListener((message) => {
                console.log("gotmessage", message)
                if (message.command == 'receive_comment' && message.id == iframe_id) {
                    setComment(message.comment) }})

            console.log('sending', {command:  "send_comment",
                                    id:        iframe_id})
            chrome.runtime.sendMessage({command:  "send_comment",
                                        id:        iframe_id}) },
        [])

    if (!comment) 
        return __('div', {}, "Loading")
    
    else 
        return __('div', {id: 'comment-form'},
                  __('p', {},
                     __('strong', {}, comment.username)),
                  __('p', {}, comment.message)) }

export default RenderComment
