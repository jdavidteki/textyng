import React, { Component } from 'react';
import { BrowserRouter, HashRouter, Switch, Route } from 'react-router-dom';
import Layout from "./components/Layout/Layout.js"

import "./App.css";

const Router = process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;


//textyng - be anything

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
                        <Route path="/" exact component={() => (<Layout pageName="fylds" />)} />
                        <Route path="/textyng" exact component={() => (<Layout pageName="textyng" />)} />
                        <Route path="/newscript" exact component={() => (<Layout pageName="newscript" />)} />
                        <Route path="/readerview/:id" exact component={() => (<Layout pageName="readerview" />)} />
                        <Route path="/editscript/:id" exact component={() => (<Layout pageName="editscript" />)} />
                        <Route path="/searchscripts" exact component={() => (<Layout pageName="searchscripts" />)} />
                        <Route path="/conversation" exact component={() => (<Layout pageName="conversation" />)} />
                        <Route path="/scriptgenerator" exact component={() => (<Layout pageName="scriptgenerator" />)} />
                        <Route path="/groupchat" exact component={() => (<Layout pageName="groupchat" />)} />
                        <Route path="/imagetovideo" exact component={() => (<Layout pageName="imagetovideo" />)} />
                        <Route path="/fylds" exact component={() => (<Layout pageName="fylds" />)} />
                    </Switch>
                </div>
            </div>
        </Router>
    );
}
}

export default App;
