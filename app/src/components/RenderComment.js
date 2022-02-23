import {useState, useEffect}     from 'react'
import {Connection, PublicKey}   from '@solana/web3.js'
import {Program, Provider, web3} from '@project-serum/anchor'
import idl                       from '../idl.json'
import __                        from '../jsml.js'
import dayjs                     from 'dayjs'
import {normalize_site,
        normalize_site_path,
        clean_text,
        query_parameters}        from '../utils.js'


const RenderComment = ({wallet, provider, program}) => {
    const [comment, setComment]   = useState(false)
    let iframe_id                 = query_parameters()['id']
    let date                      = new Date()

    const expand = () => {
        chrome.runtime.sendMessage({command: 'expand-comment',
                                    id:       iframe_id}) }
    
    const reply = () => {
        expand() }

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
                  __('p', {className: 'username'},
                     __('strong', {}, comment.username)),
                  __('p', {className: 'date'},
                     dayjs(date).format('MMM D, YYYY h:mm A')),
                  __('p', {}, comment.message),
                  __('div', {className: 'actions'},
                     __('button', {className: 'action-btn',
                                   onClick:    reply},
                        __('i', {className: 'fa fa-reply'}),
                        ' reply'),
                     __('div', {className: 'btn-spacer'}),
                     __('button', {className: 'action-btn',
                                   onClick:    expand},
                        'expand ',
                        __('i', {className: 'fa fa-expand'})))) }                        

export default RenderComment
