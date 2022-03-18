import                           bs58 from 'bs58'
import {normalize_site,
        normalize_site_path,
        clean_text,
        query_parameters}        from './utils.js'

const comments       = {}
let comments_count   = 0
let expanded_comment

function member(ar, value) {
    return ar.indexOf(value) >= 0 }

function last(ar) {
    if (ar.length == 0)
        return null
    else
        return ar[ar.length - 1] }

function identity(a) {
    return a }

function cross_member(ar1, ar2) {
    for (var i in ar1)
        if (member(ar2, ar1[i]))
	    return ar1[i]
    return false }

function to_array(what) {
    var i;
    var ar = [];

    for (i = 0; i < what.length; i++) {
        ar.push(what[i]) }

    return ar }

function uniq(ar) {
    var found = [];

    for (var i in ar)
        if (found.indexOf(ar[i]) < 0)
	    found.push(ar[i]);

    return found }

function memoize(fn) {
    const history = {}

    return (a) => {
        if (!history[a])
            history[a] = fn(a)
        return history[a] } }

function is_blockish(display) {
    return display == "block"
        || display == "table-cell"
        || display == "flex" }

function get_style(el) {
    if (!el || el == document)
        return {}
    else
        return getComputedStyle(el) }

function get_child_block(el) {
    if (!(el instanceof Element))
        return null

    else if (is_blockish(get_style(el).display))
        return el
    
        
    else {
        const children = to_array(el.childNodes)
              .map(get_child_block)
              .filter(identity)

        if (children.length > 0)
            return children[0]
        else
            return null }}

function std(list) {
    const n     = list.length
    const mean  = list.reduce((a, b) => a + b) / n
    return Math.sqrt(list.map(x => Math.pow(x - mean, 2))
                     .reduce((a, b) => a + b)
                     / n) }

const get_viable_root = memoize((el) => {
    let first_parent
    let checking_node = el

    while (!first_parent) {
        checking_node      = checking_node.parentNode
        const parent_style = get_style(checking_node)

        if (is_blockish(parent_style.display)
            || checking_node == document)
            first_parent = checking_node }

    let inner_nodes = []
    for (var i in first_parent.childNodes) 
        inner_nodes.push(get_child_block(first_parent.childNodes[i]))
    inner_nodes = inner_nodes.filter(identity)

    let inner       = inner_nodes.map(n => n.getBoundingClientRect())
    let viability   = []
    let lefts       = []
    let last_bottom = 0

    inner.map(node => {
        viability.push(node.top >= last_bottom)
        lefts.push(node.left) })

    if (viability.reduce((a, b) => a + b, 0) / viability.length > 0.95
        && std(lefts) < 10)
        return first_parent
    else
        return el })

const find_available_blocks = (el) => {
    const blocks       = []
    const viable_nodes = to_array(el.getElementsByTagName('*'))
          .filter(node => {
              const style = get_style(node)
              return (is_blockish(style.display)
                      && style.visibility != 'hidden'
                      && (node.innerText || '').trim().length > 32) })

    for (var i in viable_nodes) {        
        let viable_root = get_viable_root(viable_nodes[i])
        
        if (viable_root)
            blocks.push(viable_root) }

    return uniq(blocks) }

function get_selection_signature(selection) {
    const {all_nodes,
           root_node} = get_connecting_nodes(selection.baseNode,
                                             selection.extentNode)
    return {nodes:      all_nodes.filter(identity).map(get_node_signature),
            root_node:  get_node_signature(root_node),
            text:       selection.toString()} }

function get_connecting_nodes(start, end) {
    let matched          = false
    let start_parents    = []
    let end_parents      = []
    const nodes_list     = []
    let root_match       = false

    while (!matched) {
        start  = start.parentNode
        end    = end.parentNode
        start_parents.push(start)
        end_parents.push(end)

        if (root_match = cross_member(start_parents, end_parents))
            matched = true }
    
    let node         = start_parents[start_parents.indexOf(root_match) - 1]
    let end_node     = end_parents[end_parents.indexOf(root_match) - 1]
    let order_test   = node
    
    while (true) {
        if (order_test == end_node)
            break
        
        else if (!order_test) {
            let temp_p    = start_parents
            end_parents   = start_parents
            start_parents = end_parents
            let temp_n    = end_node
            end_node      = node
            node          = temp_n
            break }
        
        else 
            order_test = order_test.nextSibling; }
    
    while (node != end_node) {
        nodes_list.push(node)
        node = node.nextSibling }
    
    nodes_list.push(end_node)
    
    return {all_nodes: nodes_list,
            root_node: root_match} }

function get_node_signature(el) {
    const parent = el.parentNode
    
    return {text:        el.innerText,
            tag:         el.tagName || 'text',
            id:          el.id,
            classNames:  class_names(el),
            parent:     {tag:      parent.tagName || 'text',
                         id:       parent.id,
                         classes:  class_names(parent)}} }

function class_names(el) {
    return (parent.className || '').toString().split(/\W+/) }

let last_right_clicked = false

function draw_comment(comment) {
    const el             = find_el_from_definition(last(comment.selection.nodes))
    const comment_block  = render_comment(comment)

    insert_comment_block(el, comment_block, comment)

    highlight_selection(comment.selection.text,
                        el,
                        comment.id)}

function find_el_from_definition(definition) {
    let candidates = document.querySelectorAll(
        definition.parent.tag
            + ' > ' + definition.tag
            + (definition.id && definition.id[0].match(/[a-zA-Z]/)
               ? '#' + definition.id
               : ''))

    for (var i in candidates) {
        let candidate = candidates[i]
        
        if (clean_text(candidate.innerText || '') == definition.text)
            return candidate }

    return null }

function render_comment(comment) {
    const id            = "comment-" + comment.id
    const node          = document.createElement("iframe");

    chrome.runtime.sendMessage({command:  "save_comment",
                                id:        comment.id,
                                comment:   comment})

    node.id             = id
    node.src            = chrome.runtime.getURL('/iframe.html#/render-comment?'
                                                + 'id=' + comment.id)
    node.name           = comment.id
    node.className      = 'metaframe-comment-iframe metaframe-iframe'
    
    return node }

function draw_subcomment(comment_id) {
    const id            = "comment-" + comment_id
    const node          = document.createElement("iframe");

    node.id             = id
    node.src            = chrome.runtime.getURL('/iframe.html#/render-comment?'
                                                + 'id=' + comment_id)
    node.name           = comment_id
    node.className      = 'metaframe-comment-iframe metaframe-iframe'

    document.body.appendChild(node)
    expand_window(node)
    
    return node }
    

function highlight_selection(string, el, id) {
    const positions  = find_selection(string, el)
    let position     = 0
    let childNodes   = to_array(el.childNodes)

    while (position < positions.end) {
        let node = childNodes[0]
        let text = node.textContent
        
        if (text.length + position < positions.start) {
            childNodes.shift()
            position += text.length
            
            if (childNodes.length == 0)
                break }

        else {
            add_selection(node,
                          Math.max(positions.start - position, 0),
                          Math.min(positions.end - position, text.length),
                          id)
            position += text.length }}}

function add_selection(node, start, end, id) {    
    if (node instanceof Text) {
        const node_text       = node.textContent
        let outer_span        = document.createElement('span')
        outer_span.className  = 'mf-hl-outerspan selection-' + id
        let inner_span        = document.createElement('span')
        inner_span.className  = 'mf-hl-selection selection-' + id

        outer_span.appendChild(
            document.createTextNode(node_text.slice(0, start)))
        inner_span.innerHTML = node_text.slice(start, end)
        outer_span.appendChild(inner_span)
        outer_span.appendChild(
            document.createTextNode(node_text.slice(end)))
        
        node.parentElement.insertBefore(outer_span, node.nextSibling)
        node.parentElement.removeChild(node) }

    else {
        let parent_node       = node.parentElement
        let next_node         = node.nextSibling
        let inner_span        = document.createElement('span')
        inner_span.className  = 'mf-hl-selection selection-' + id
        
        parent_node.removeChild(node)
        inner_span.appendChild(node)
        parent_node.insertBefore(node, next_node) }}
        
function find_selection(string, el) {
    const text  = el.innerText

    let start   = text.search(string)
    
    if (start > 0) 
        return {start: start,
                end:   start + string.length}

    else {
        let right_start   = 0
        let right_end     = 0
        let right_length  = 1
        let found

        do {
            found = text.search(string.slice(0 - right_length))
            if (found > 0) {
                right_start = found
                right_end   = found + right_length
                right_length++ }}
        
        while (found > 0)

        let left_start  = 0
        let left_end    = 0
        let left_length = 1

        do {
            found = text.search(string.slice(0 - left_length))
            if (found > 0) {
                left_start = found
                left_end   = found + left_length
                left_length++ }}
        
        while (found > 0)

        if (left_length > right_length)
            return {start: left_start,
                    end:   left_end}

        else
            return {start: right_start,
                    end:   right_end}}}

function get_sub_text_nodes(el) {
    if (el instanceof Text)
        return el
    
    else if (!el)
        return null

    else return to_array(el.childNodes)
        .map(get_sub_text_nodes)
        .filter(identity)
        .reduce((a, b) => a.concat(b), []) }

function get_text_bounds(el) {
    const rect      = el.getBoundingClientRect();
    const nodes     = get_sub_text_nodes(el)
    const root_top  = Math.round(window.pageYOffset - document.body.clientTop)
    const root_left = Math.round(window.pageXOffset - document.body.clientLeft)

    if (nodes.length == 0)
        return rect
    
    else 
        return (nodes
                .map(
                    n => {
                        const r = new Range()
                        r.selectNode(n)
                        return r.getBoundingClientRect(); })
                
                .filter(r => (r.left != 0
                              || r.right != 0
                              || r.top != 0
                              || r.bottom != 0))
                
                .reduce(
                    (a, b) => {
                        return {left:   Math.min(a.left,   root_left + b.left),
                                right:  Math.max(a.right,  root_left + b.right),
                                top:    Math.min(a.top,    root_top + b.top),
                                bottom: Math.max(a.bottom, root_top + b.bottom)} },
                    {left:   rect.right + root_left,
                     right:  rect.left + root_left,
                     top:    rect.bottom + root_top,
                     bottom: rect.top + root_top})) }

const comments_wrapper_for_block = memoize((el) => {
    const wrapper   = document.createElement('div')
    const positions = get_text_bounds(el)
    
    wrapper.className      = 'metaframe-comments-wrapper'
    wrapper.style.position = 'absolute'
    wrapper.style.left     = (positions.right + 18).toString() + 'px'
    wrapper.style.top      = positions.top.toString() + 'px'

    document.body.appendChild(wrapper)

    return wrapper })

function insert_comment_block(element, comment_block, comment) {
    const wrapper = comments_wrapper_for_block(element)
    wrapper.appendChild(comment_block) }
    
const selections = {}

function open_new_comment_popup(selection) {
    const id        = "id" + (Math.random() * 10000000).toString().slice(2)
    selections[id]  = selection

    chrome.runtime.sendMessage({command:  "save_node",
                                href:      window.top.location.href,
                                id:        id,
                                selection: selection})

    const node          = document.createElement("iframe");

    node.src            = chrome.runtime.getURL('/iframe.html#/leave-comment'
                                                + '?id=' + id
                                                + '&existing_count=' + comments_count)
    node.name           = id
    node.style.position = "fixed"
    node.style.outline  = "none"
    node.style.border   = "none"
    node.style.height   = '60vh'
    node.style.width    = '60vw'
    node.style.top      = '20vh'
    node.style.left     = '20vw'
    node.className      = 'metaframe-iframe'
    node.id             = 'metaframe-window'

    document.body.appendChild(node)
    expand_window(node, true) }

function request_comments() {
    const site          = normalize_site(window.location.href)
    const path          = normalize_site_path(window.location.href)
    const blocks        = find_available_blocks(document.body)

    chrome.runtime.sendMessage({
        command: 'send_to_sol', 
        data: {command: 'request_comments',
               site,
               path,
               blocks}}) }

function expand_window(iframe, small) {
    const wrapper                = document.createElement("div")
    wrapper.style.position       = 'fixed'
    wrapper.style.background     = 'rgba(100,100,100,0.1)'
    wrapper.style.backdropFilter = 'blur(8px)'
    wrapper.style.top            = '0'
    wrapper.style.left           = '0'
    wrapper.style.right          = '0'
    wrapper.style.bottom         = '0'
    wrapper.style.zIndex         = 10000
    wrapper.id = 'metaframe-window-wrapper'
    iframe.style                  = ''
    iframe.style.position        = 'fixed'
    iframe.style.top             = small ? '30vh' : '10vh'
    iframe.style.left            = small ? '30vw' : '10vw'
    iframe.style.right           = small ? '30vw' : '10vw'
    iframe.style.bottom          = small ? '30vh' : '10vh'
    iframe.style.width           = small ? '40vw' : '80vw'
    iframe.style.height          = small ? '40vh' : '80vh'
    iframe.style.zIndex          = 100000
    expanded_comment             = iframe
    document.body.appendChild(wrapper) }

document.addEventListener('contextmenu', (e) => {
    last_right_clicked = e.target })

window.top.addEventListener('message', (message, sender) => {
    if (message.data.forward_to_backend || message.data.command == 'forward_to_backend')
        chrome.runtime.sendMessage(message.data.data)

    else if (message.data.command == 'send_comment') {
        
        document
            .getElementById(message.id)
            .contentWindow
            .postMessage({command: 'receive_comment',
                          id:       message.id,
                          comment:  comments[message.id.replace('comment-', '')]}) }})

chrome.runtime.onMessage.addListener( (message, sender) => {
    switch (message.command) {
    case "comment-on-selection":
        open_new_comment_popup(get_selection_signature(window.getSelection()))
        break

    case "close-window":
        document.body.removeChild(document.getElementById('metaframe-window-wrapper'))
        
        if (document.getElementById('metaframe-window')) 
            document.body.removeChild(document.getElementById('metaframe-window'))
        else 
            expanded_comment.style = ''
        
        break;
        
    case "expand-comment":
        expand_window(document.getElementById(message.id))
        break
        
    case "open-subcomment":
        document.body.removeChild(document.getElementById('metaframe-window-wrapper'))
        expanded_comment.style = ''
        draw_subcomment(message.id)
        break
        
    case "receive_comments":
        comments_count = message.comments.length
        
        message.comments.map((object) => {
            const comment_id = bs58.encode(object.publicKey._bn.words)
            const score      = message.scores[comment_id]
            const _comment   = object.account
            console.log({_comment, object}, _comment.timestamp,)
            const comment    = {username:  _comment.username,
                                message:   _comment.message,
                                node_hash: _comment.nodeHash,
                                site:      _comment.site,
                                time:      object.timestamp,
                                score:     score,
                                voting:    message.votestyle,
                                selection: JSON.parse(_comment.selection),
                                id:        comment_id} 
            
            comments[comment.id] = comment
            draw_comment(comment) })
        break

    case "receive_node":
        document.getElementById(message.id).contentWindow.postMessage(message)
        break
        
    case "link-phantom":
        break

    case "send_to_controller":
        window.top.postMessage(message.data)
    }
})

if (document.readyState == "complete"
    || document.readyState == "interactive")
    request_comments()

else 
    document.addEventListener('DOMContentLoaded', () => {
        request_comments() })
