const app_url = 'https://metaframe.io:8081'
import {normalize_site,
        normalize_site_path,
        query_parameters}        from './utils.js'

//chrome.runtime.sendMessage({ command: "init-page" });
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
    
    insert_comment_block(el, comment_block, comment) }

function find_el_from_definition(definition) {
    let candidates = document.querySelectorAll(
        definition.parent.tag
            + ' > ' + definition.tag
            + (definition.id && definition.id[0].match(/[a-zA-Z]/)
               ? '#' + definition.id
               : ''))

    for (var i in candidates) {
        let candidate = candidates[i]
        
        if ((candidate.innerText || '').trim() == definition.text)
            return candidate }

    return null }

function render_comment(comment) {
    const node             = document.createElement('div')
    node.id                = comment.id
    node.className         = 'metaframe-comment'

    const name_node        = document.createElement('div')
    name_node.className    = 'metaframe-byline'
    name_node.innerText    = comment.username

    const comment_node     = document.createElement('div')
    comment_node.className = 'metaframe-comment-body'
    comment_node.innerText = comment.message

    node.appendChild(name_node)
    node.appendChild(comment_node)
    
    return node }

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
    const rect  = el.getBoundingClientRect();
    const nodes = get_sub_text_nodes(el)

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
                        return {left:   Math.min(a.left, b.left),
                                right:  Math.max(a.right, b.right),
                                top:    Math.min(a.top, b.top),
                                bottom: Math.max(a.bottom, b.bottom)} },
                    {left:   rect.right,
                     right:  rect.left,
                     top:    rect.bottom,
                     bottom: rect.top})) }

const comments_wrapper_for_block = memoize((el) => {
    const wrapper   = document.createElement('div')
    const positions = get_text_bounds(el)
    
    wrapper.className      = 'metaframe-comments-wrapper'
    wrapper.style.position = 'absolute'
    wrapper.style.left     = (positions.right + 18).toString() + 'px'
    wrapper.style.top      = positions.top.toString() + 'px'

    console.log({wrapper, positions, el}, wrapper.style)
    
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

    node.src            = chrome.runtime.getURL('/iframe.html#/leave-comment?id=' + id)
    node.name           = id
    node.style.position = "fixed"
    node.style.outline  = "none"
    node.style.border   = "none"
    node.style.height   = '60vh'
    node.style.width    = '60vw'
    node.style.top      = '20vh'
    node.style.left     = '20vw'
    node.className      = 'metaframe-iframe'

    document.body.appendChild(node) }

function request_comments() {
    const site          = normalize_site(window.location.href)
    const path          = normalize_site_path(window.location.href)
    const blocks        = find_available_blocks(document.body)

    console.log('requesting', site, path, blocks)

    chrome.runtime.sendMessage({
        command: 'send_to_sol', 
        data: {command: 'request_comments',
               site,
               path,
               blocks}}) }

document.addEventListener('contextmenu', (e) => {
    console.log('clicked', e)
    last_right_clicked = e.target })

window.top.addEventListener('message', (message, sender) => {
    console.log('windowevent', message.data.command, message.data, sender);
    if (message.data.forward_to_backend || message.data.command == 'forward_to_backend')
        chrome.runtime.sendMessage(message.data.data) })

chrome.runtime.onMessage.addListener( (message, sender) => {
    switch (message.command) {
    case "comment-on-selection":
        open_new_comment_popup(get_selection_signature(window.getSelection()))
        break

    case "receive_comments":
        console.log('reccomments', {message})
        break

    case "receive_node":
        document.getElementById(message.id).contentWindow.postMessage(message)
        break
        
    case "link-phantom":
        break

    case "send_to_controller":
        console.log('fwding', message.data, message)
        window.top.postMessage(message.data)
    }
})

if (document.readyState == "complete"
    || document.readyState == "interactive")
    request_comments()

else 
    document.addEventListener('DOMContentLoaded', () => {
        request_comments() })
