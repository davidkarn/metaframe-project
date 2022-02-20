const menu_item_clicked = (info, tab) => {
    console.log({info, tab}, info.menuItemId)
    
    if (info.menuItemId == 'FRAME_MENU')
        chrome.tabs.sendMessage(
            tab.id,
            {command: 'comment-on-selection',
             info:     info})
    
    else if (info.menuItemId == 'FRAME_LINK_PHANTOM')
        chrome.tabs.sendMessage(
            tab.id,
            {command: 'link-phantom',
             info:     info}) }

chrome.contextMenus.create(
    {contexts:  ['selection'],
     id:         'FRAME_MENU',
     title:      'Comment on this'})


chrome.contextMenus.onClicked.addListener(menu_item_clicked)

const nodes = {}
const hrefs = {}
chrome.runtime.onMessage.addListener((message, sender) => {
    console.log('gotmessage', message, sender, nodes)

    if (message.command == 'save_node') {
        hrefs[message.id] = message.href
        nodes[message.id] = message.selection }

    else if (message.command == 'send_node')
        chrome.tabs.sendMessage(
            sender.tab.id,
            {command: 'receive_node',
             id:       message.id,
             href:     hrefs[message.id],
             node:     nodes[message.id]})
  
    else if (message.command == 'forward_comments')
        chrome.tabs.sendMessage(
            message.tab_id,
            {command:   'receive_comments',
             comments:   message.comments})
  
    else if (message.command == 'send_to_sol') {
        chrome.tabs.query({url: 'https://metaframe.io:8080/connector.html'},
		                      (result) => {
                              console.log('sending', message.data, result)
                              chrome.tabs.sendMessage(
                                  result[0].id,
                                  {command: 'send_to_controller',
                                   tab_id:   sender.tab.id,
                                   data:     {tab_id: sender.tab.id,
                                              ...message.data}})}) } }) 
 