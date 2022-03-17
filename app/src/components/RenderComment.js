import {useState, useEffect}     from 'react'
import {Connection, PublicKey}   from '@solana/web3.js'
import {Program, Provider, web3} from '@project-serum/anchor'
import idl                       from '../idl.json'
import md5                       from 'js-md5'
import __                        from '../jsml.js'
import dayjs                     from 'dayjs'
import {normalize_site,
        normalize_site_path,
        clean_text,
        query_parameters}        from '../utils.js'


const RenderComment = ({wallet, provider, program}) => {
    const [programIdl, setProgramIdl]        = useState(null)
    const [replying, setReplying]            = useState(false)
    const [expanded, setExpanded]            = useState(false)
    const [subcomments, set_subcomments]     = useState({})
    const [reply_author, set_reply_author]   = useState('')
    const [reply_message, set_reply_message] = useState('')
    const [comment, setComment]              = useState(false)
    let iframe_id                            = query_parameters()['id']
    const [replies, set_replies]             = useState({[iframe_id]: []})
    const [parent, set_parent]               = useState(false)
    let date                                 = new Date()

    const [leaving_subcomment,
           set_leaving_subcomment]           = useState(false)
    const [subcomment_username,
           set_subcomment_username]          = useState("")
    const [subcomment_message,
           set_subcomment_message]           = useState("")
    const [subcomment_selection,
           set_subcomment_selection]         = useState({})

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
             data:    {command: 'close-window',
                       id:      'comment-' + iframe_id}}) }

    const upvote = (comment) => {
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:     {command:    'upvote',
                       site:        comment.site,
                       comment:     comment.id}}) }

    const downvote = (comment) => {
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:     {command:    'downvote',
                       site:        comment.site,
                       comment:     comment.id}}) }
    
    const reply = () => {
        setReplying(true)
        expand() }

    const send_reply = () => {
        set_reply_author('')
        set_reply_message('')
        
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:     {command:    'post_reply',
                       site:        comment.site,
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

    const open_subcomment_form = () => {
        const selection        = window.getSelection()
        const selection_text   = selection.toString()
        const root_id          = comment.id

        console.log('open_subcomment_form', selection, replies, root_id)
        
        if (selection.anchorNode == selection.extentNode) {
            const comment_id = selection.anchorNode.parentNode.id.replace('message-', '')
            const comment    = replies[root_id]
                  .find(r => r.id == comment_id)
            const start      = comment.message.search(selection_text)

            console.log({comment, comment_id, start}, selection_text)
            if (start > -1) {
                set_subcomment_selection({text:   selection_text,
                                          parent: root_id,
                                          start:  start,
                                          end:    start + selection_text.length})
                set_leaving_subcomment(comment_id) }}}

    const send_subcomment = () => {
        const site               = "metaframe"
        const path               = leaving_subcomment // id of parent comment
        
        chrome.runtime.sendMessage({
            command: 'send_to_sol',
            data:    {command: 'post_comment',
                      name:     subcomment_username,
                      message:  subcomment_message,
                      site,
                      path,
                      node:     subcomment_selection}}) }

    
    useEffect(
        () => {
            chrome.runtime.sendMessage({
                command:  "send_to_sol",
                data:     {command:      "request_replies",
                           parent_id:     iframe_id}})
            
            chrome.runtime.sendMessage({
                command:  "send_comment",
                id:        iframe_id})
            
            chrome.storage.local.get().then(
                storage => {
                    if (storage.idl_address)
                        setProgramIdl(
                            storage.idl_address) }) },
        [])

    useEffect(
        () => {
            chrome.runtime.sendMessage({
                command:  "send_to_sol",
                data:     {command:      "request_subcomments",
                           root_id:       comment.id}}) },
        [comment])

    useEffect(
        () => {
            const chrome_listener = (message) => {
                console.log("gotmessage", message)
                if (message.command == 'receive_comment' && message.id == iframe_id) {
                    setComment(message.comment) }

                else if (message.command == 'receive_subcomments') {
                    const new_subcomments = subcomments
                    const reply_ids       = {}
                    
                    replies[comment.id]
                        .map(r => reply_ids[md5(r.id)] = r.id)
                    
                    message.subcomments.map(s => {
                        const parent_id = reply_ids[s.parent_id]
                        if (!new_subcomments[parent_id])
                            new_subcomments[parent_id] = []

                        new_subcomments[parent_id].push(s) })
                    
                    set_subcomments(new_subcomments)
                    console.log('subcomments', new_subcomments) }

                else if (message.command == 'comment-on-selection')
                    open_subcomment_form()

                else if (message.command == 'receive_replies') {
                    set_replies({...replies,
                                 [message.parent_id]: message.replies}) }}

            chrome.runtime.onMessage.addListener(chrome_listener)

            return () => {
                chrome.runtime.onMessage.removeListener(chrome_listener) }},
        [iframe_id, replies, comment, subcomments])

    const render_comment = (comment, root_comment) => {
        return __(
            'div', {className: 'a-comment-wrapper'},
            __('div', {className: 'a-comment',
                       id:        "comment-" + comment.id},
               
               __('p', {className: 'username'},
                  __('strong', {}, comment.username)),
               
               __('p', {className: 'date'},
                  dayjs(date).format('MMM D, YYYY h:mm A')),
               
               __('p', {className:  'comment-message',
                        id:         'message-' + comment.id}, comment.message),

               programIdl
               && (comment.voting == 'updown' || root_comment.voting == 'updown')
               && __(
                   'p', {},
                   __('span', {className: 'score'},
                      comment.score), ' ', 
                   __('span', {onClick:   () => upvote(comment),
                               className: 'upvote'}, __('i', {className: 'fa fa-arrow-up'})), ' ',
                   __('span', {onClick:   () => downvote(comment),
                               className: 'downvote'}, __('i', {className: 'fa fa-arrow-down'})), ' '),

               leaving_subcomment == comment.id && __(
                   'div', {className: 'subcomment-form'}, 
                   __('input', {type:        'text',
                                className:   'form-control',
                                placeholder: 'Author',
                                value:        subcomment_username,
                                onChange:    (e) => set_subcomment_username(e.target.value)}),
                   __('textarea', {className:   'form-control',
                                   value:        subcomment_message,
                                   placeholder: 'Comment',
                                   onChange:    (e) => set_subcomment_message(e.target.value)}),
                   __('button', {className: 'submit-btn',
                                 onClick:    send_subcomment},
                      "Post Subreply"))),

            subcomments[comment.id] && subcomments[comment.id].length > 0 &&
                __('div', {className: 'subcomments-summary'},
                   
                   subcomments[comment.id].map(subcomment => __(
                       'div', {className: 'a-subcomment'},

                       __('p', {className: 'username'},
                          __('strong', {}, subcomment.username)),
                       __('p', {className: 'date'},
                          dayjs(subcomment.timestamp).format('MMM D, YYYY h:mm A')),
                       __('p', {className: 'subcomment-message',
                                id:         'message-' + subcomment.id},
                          subcomment.message))))) }

    console.log({comment, replies})
    
    if (!comment) 
        return __('div', {}, "Loading")
    
    else 
        return __('div', {id: 'comment-form', className: replying ? 'expanded' : ''},
                  __('div', {id: 'top-part'},
                     render_comment(comment, comment),

                     replying && replies[comment.id].length && __(
                         'div', {id: 'comment-replies'},
                         __('strong', {}, "Replies"),
                         
                         replies[comment.id]
                             .map((c) => render_comment(c, comment))),
                     
                     replying && reply_form()),
                  
                  __('div', {className: 'actions'},
                     actions())) }                        

export default RenderComment

