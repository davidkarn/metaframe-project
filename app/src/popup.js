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
    const [idlAddress, setIdlAddress]  = useState('')
    
    useEffect(
        () => {
            setOptions(localStorage)
            setIdlAddress(localStorage.idlAddress)
            setModerationAddress(localStorage.moderationAddress)},
        [])

    const save = (address) => {
        localStorage.moderationAddress = moderationAddress
        localStorage.idlAddress = idlAddress
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
                              value:      idlAddress,
                              onChange:  (e) => setIdlAddress(e.target.value)})),

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
