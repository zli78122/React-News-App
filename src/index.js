import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap-grid.min.css';
import App from './App';
import {HashRouter} from 'react-router-dom'

ReactDOM.render(
    <HashRouter>
        <App />
    </HashRouter>, document.getElementById('root'));