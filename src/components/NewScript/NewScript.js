import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";
import EditScript from "../EditScript/EditScript.js";

var textyng = new Script("NewScript");

import "./NewScript.css";

class ConnectedNewScript extends Component {
  constructor(props) {
    super(props);

    this.state = {
      script: textyng,
    };
  }

  render() {
    return (
        <div className="NewScript">
          <EditScript isNewScript={true} script={this.state.script} />
        </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let NewScript = withRouter(connect(mapStateToProps)(ConnectedNewScript));
export default withRouter(NewScript);
