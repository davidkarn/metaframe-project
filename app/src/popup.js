import __                        from './jsml.js'
import {useState, useEffect}     from 'react'
import React                     from 'react'
import ReactDOM                  from 'react-dom'
import md5                       from 'js-md5'
import {HashRouter,
        Route,
        Routes}                  from "react-router-dom"


const App = () => {
    const [options, setOptions]        = useState({})
    const [success, setSuccess]        = useState(false)
    const [moderationAddress,
           setModerationAddress]       = useState('')
    const [idl_address, set_idl_address]  = useState('')
    
    useEffect(
        () => {
            setOptions(localStorage)
            chrome.storage.local
                .get()
                .then(
                    x => set_idl_address(x.idl_address)) },
        [])

    const save = (address) => {
        chrome.storage.local.set({idl_address: idl_address})
        setSuccess(true) }

    return __('div', {style: {padding:    '18px',
                              paddingTop: '8px',
                              width:      '180px'}},
              __('p', {},
                 __('strong', {}, "Moderation Address")),
              
              __('p', {},
                 __('input', {className: 'form-control',
                              type:      'text',
                              value:      moderationAddress,
                              onChange:  (e) => setModerationAddress(e.target.value)})),

              __('p', {},
                 __('strong', {}, "Idl Address")),
              
              __('p', {},
                 __('input', {className: 'form-control',
                              type:      'text',
                              value:      idl_address,
                              onChange:  (e) => set_idl_address(e.target.value)})),

              success && __('p', {}, "Updated successfully"),
              
              __('p', {},
                 __('button', {onClick:     save,
                               className:  'btn',
                               style:      {width: '100%'}},
                    "Save"))) }
              
ReactDOM.render( 
    __(React.StrictMode, {},
       __(App)),
    document.getElementById('root'))
