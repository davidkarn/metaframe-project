import {useState}                from 'react'
import {HashRouter,
        Route,
        Routes}                  from "react-router-dom"
import idl                       from '../idl.json'
import __                        from '../jsml.js'

import LeaveComment              from './LeaveComment.js'
import RenderComment             from './RenderComment.js'

window.addEventListener('message', (message) => {
    console.log('gotmessageinifrmae', message) })

const App = () => {
    return __(HashRouter, {},
              __(Routes, {},
                 __(Route, {path:    "/render-comment/",
                            element: __(RenderComment, {})}),
                 __(Route, {path:    "/leave-comment",
                            element: __(LeaveComment, {})}))) }
                                            
export default App
