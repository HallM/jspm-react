import React from 'react'
import { Router, Route, browserHistory } from 'react-router'
import Home from './routes/home'

console.log('test routes');

const routes = <Route path='/' component={Home} />

export default routes;
