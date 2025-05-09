import React, { Component, lazy, Suspense } from 'react';
import { BrowserRouter, HashRouter, Switch, Route } from 'react-router-dom';
import Layout from "./components/Layout/Layout.js"
import "./App.css";

const Router = process.env.NODE_ENV === 'production' ? HashRouter : BrowserRouter;

//textyng - bhe everytingg
window.onresize = function() {
  document.getElementsByClassName("App").height = window.innerHeight;
}
window.onresize();

// Use React.lazy to dynamically import the Layout component
const LayoutLazy = lazy(() => import("./components/Layout/Layout.js"));

class App extends Component {
  render() {
    return (
        <Router>
            <div className="App">
                <div className="App-content">
                    <Suspense fallback={<div>Loading...</div>}>
                        <Switch>
                            <Route path="/" exact component={() => (<LayoutLazy pageName="fylds" />)} />
                            <Route path="/textyng" exact component={() => (<LayoutLazy pageName="textyng" />)} />
                            <Route path="/newscript" exact component={() => (<LayoutLazy pageName="newscript" />)} />
                            <Route path="/readerview/:id" exact component={() => (<LayoutLazy pageName="readerview" />)} />
                            <Route path="/editscript/:id" exact component={() => (<LayoutLazy pageName="editscript" />)} />
                            <Route path="/searchscripts" exact component={() => (<LayoutLazy pageName="searchscripts" />)} />
                            <Route path="/conversation" exact component={() => (<LayoutLazy pageName="conversation" />)} />
                            <Route path="/scriptgenerator" exact component={() => (<LayoutLazy pageName="scriptgenerator" />)} />
                            <Route path="/groupchat" exact component={() => (<LayoutLazy pageName="groupchat" />)} />
                            <Route path="/imagetovideo" exact component={() => (<LayoutLazy pageName="imagetovideo" />)} />
                            <Route path="/fylds" exact component={() => (<LayoutLazy pageName="fylds" />)} />
                            <Route path="/pygpal" exact component={() => (<LayoutLazy pageName="pygpal" />)} />
                            <Route path="/grypcht/adddata" exact component={() => (<LayoutLazy pageName="grypchtadddata" />)} />
                            <Route path="/mediumscraper" exact component={() => (<LayoutLazy pageName="mediumscraper" />)} />
                            <Route path="/sweducerworkstation" exact component={() => (<LayoutLazy pageName="sweducerworkstation" />)} />
                            <Route path="/sendheaventoai" exact component={() => (<LayoutLazy pageName="sendheaventoai" />)} />
                            <Route path="/artistworkstation" exact component={() => (<LayoutLazy pageName="artistworkstation" />)} />
                            <Route path="/customerworkstation" exact component={() => (<LayoutLazy pageName="customerworkstation" />)} />
                        </Switch>
                    </Suspense>
                </div>
            </div>
        </Router>
    );
  }
}

export default App;
