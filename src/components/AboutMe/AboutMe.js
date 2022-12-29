import React, { Component } from "react";

import "./AboutMe.css";

class AboutMe extends Component{
  constructor(props){
    super(props);

    this.state = {
        pageName: this.props.pageName
    }
  }

  componentDidMount(){
    //
  }

  render(){
    return (
        <div className="AboutMe l-container">
            <div className="AboutMe-left"></div>
            <div className="AboutMe-right">
                <h1 className="AboutMe-title">
                    About Me
                </h1>
                <div className="AboutMe-desc">
                    Podcasting operational change management inside of workflows to establish a framework. Taking seamless key performance indicators offline to maximise the long tail. Keeping your eye on the ball while performing a deep dive on the start-up mentality to derive convergence on cross-platform integration. Objectively innovate empowered manufactured products whereas parallel platforms. Holisticly predominate extensible testing procedures for reliable supply chains. Dramatically engage top-line web services vis-a-vis cutting-edge deliverables.
                </div>
            </div>
        </div>
    )}
}

export default AboutMe;
