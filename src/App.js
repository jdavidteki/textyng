import React, { Component } from 'react';
import { BrowserRouter, HashRouter, Switch, Route } from 'react-router-dom';
import Layout from "./components/Layout/Layout.js"

import "./App.css";

const Router = process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;


//textyng - everything is a message

window.onresize = function() {
  document.getElementsByClassName("App").height = window.innerHeight;
}
window.onresize();

class App extends Component {
  render() {
    return (
        <Router>
            <div className="App">
                <div className="App-content">
                    <Switch>
                        <Route path="/" exact component={() => (<Layout pageName="textyng" />)} />
                        <Route path="/textyng" exact component={() => (<Layout pageName="textyng" />)} />
                        <Route path="/newscript" exact component={() => (<Layout pageName="newscript" />)} />
                        <Route path="/readerview/:id" exact component={() => (<Layout pageName="readerview" />)} />
                        <Route path="/editscript/:id" exact component={() => (<Layout pageName="editscript" />)} />
                        <Route path="/searchscripts" exact component={() => (<Layout pageName="searchscripts" />)} />
                        <Route path="/cwc" exact component={() => (<Layout pageName="cwc" />)} />
                    </Switch>
                </div>
            </div>
        </Router>
    );
}
}

export default App;
