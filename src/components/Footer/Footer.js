import React, { Component } from "react";

import "./Footer.css";

class Footer extends Component {
  constructor(props){
    super(props);

    this.state = {
      catSelected: "textyng",
      findMeIconHover: "#6c47db",
    }
  }

  render() {
    return (
      <div className={"Footer-default"}>
        <div className="frame-142">
          <div className="Footer-greeting">
            be anything
          </div>
        </div>
      </div>
    )
  };
}

export default Footer;
