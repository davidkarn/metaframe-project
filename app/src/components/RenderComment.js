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
    const [replying, setReplying]            = useState(false)
    const [expanded, setExpanded]            = useState(false)
    const [reply_author, set_reply_author]   = useState('')
    const [reply_message, set_reply_message] = useState('')
    const [comment, setComment]              = useState(false)
    let iframe_id                            = query_parameters()['id']
    let date                                 = new Date()

    const expand = () => {
        setReplying(true)
        chrome.runtime.sendMessage(
            {command: 'send-to-tab',
             data:    {command: 'expand-comment',
                       id:      'comment-' + iframe_id}}) }
    
    const close = () => {
        setReplying(false)
        chrome.runtime.sendMessage(
            {command: 'send-to-tab',
             data:    {command: 'close-comment',
                       id:      'comment-' + iframe_id}}) }
    
    const reply = () => {
        setReplying(true)
        expand() }

    const send_reply = () => {
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:     {command:    'post_reply',
                       to_comment:  iframe_id,
                       username:    reply_author,
                       message:     reply_message}}) }

    const actions = () => {
        if (!replying) 
            return [__('button', {className: 'action-btn',
                                  onClick:    reply},
                       __('i', {className: 'fa fa-reply'}),
                       ' reply'),
                    __('div', {className: 'btn-spacer'}),
                    __('button', {className: 'action-btn',
                                  onClick:    expand},
                       'expand ',
                       __('i', {className: 'fa fa-expand'}))]

        else
            return [__('div', {className: 'btn-spacer'}),
                    __('button', {className: 'action-btn',
                                  onClick:    close},
                       'close ',
                       __('i', {className: 'fa fa-compress'}))] }

    const reply_form = () => {
        return __(
            'div', {className: 'reply-form'},
            __('p', {}, __('strong', {}, "Reply")),
            __('input', {type:        'text',
                         className:   'form-control',
                         placeholder: 'Author',
                         value:        reply_author,
                         onChange:    (e) => set_reply_author(e.target.value)}),
            __('textarea', {className:   'form-control',
                            value:        reply_message,
                            placeholder: 'Comment',
                            onChange:    (e) => set_reply_message(e.target.value)}),
            __('button', {className: 'submit-btn',
                          onClick:    send_reply},
               "Post Reply")) }
    
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

                  replying && reply_form(),
                  
                  __('div', {className: 'actions'},
                     actions())) }                        

export default RenderComment

