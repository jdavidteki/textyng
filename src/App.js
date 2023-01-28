import React, { Component } from 'react';
import { Switch, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout.js"

import "./App.css";

//textyng - everything is a message

window.onresize = function() {
  document.getElementsByClassName("App").height = window.innerHeight;
}
window.onresize();


class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-content">
          <Switch>
            <Route path="/" exact component={() => (<Layout pageName="textyng" />)}/>
            <Route path="/textyng"  exact component={() => (<Layout pageName="textyng" />)}/>
            <Route path="/newscript" exact component={() => (<Layout pageName="newscript" />)}/>
            <Route path="/readerview/:id"  component={() => (<Layout pageName="readerview" />)}/>
            <Route path="/editscript/:id"  component={() => (<Layout pageName="editscript" />)}/>
            <Route path="/searchscripts" exact component={() => (<Layout pageName="searchscripts" />)}/>
          </Switch>
        </div>
      </div>
    );
  }
}

//this comment is to trigger a rebuild
export default App;
