import React, { Component } from 'react';
import { Switch, Route } from "react-router-dom";
import Layout from "./components/Layout/Layout.js"
import { loadStripe } from "@stripe/stripe-js";

import "./App.css";

//textyng - everything is a message

window.onresize = function() {
  document.getElementsByClassName("App").height = window.innerHeight;
}
window.onresize();


const stripePromise = loadStripe("pk_test_6pRNASCoBOKtIshFeQd4XMUh");


class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-content">
          <Switch>
            <Route path="/" exact component={() => (<Layout pageName="textyng" />)}/>
            <Route path="/textyng"  exact component={() => (<Layout pageName="textyng" />)}/>
            <Route path="/newscript" exact component={() => (<Layout pageName="newscript" />)}/>
            <Route path="/readerview/:id" exact component={() => (<Layout pageName="readerview" />)}/>
            <Route path="/readerview/:id" exact component={() => (<Layout pageName="readerview" />)}/>
            <Route path="/editscript/:id" exact component={() => (<Layout pageName="editscript" />)}/>
          </Switch>
        </div>
      </div>
    );
  }
}

//this comment is to trigger a rebuild
export default App;
