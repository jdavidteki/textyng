import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import TextField from "@material-ui/core/TextField";
import Bck11imagn from "./bck11imagn.png";
import Bck11originalimgn from "./bck11originalimgn.png";

import "./Advertisement.css";

class ConnectedAdvertisement extends Component {
  constructor(props) {
    super(props);

    this.state = {
      sectionToShow: "image",
      imagnToUse: "",
      overlapGroup: Bck11originalimgn,
      hoverSec: true,
      textFieldTop: 16,
      textFieldLft: 16,
    };
  }

  componentDidMount() {
    document.getElementById("Advertisement-id")
    .onmouseenter = (e) => {
      this.setState({sectionToShow: "div", textFieldTop: e.pageY})
    }

    document.getElementById("Advertisement-id")
    .onmouseleave = () => {
      this.setState({sectionToShow: "image"})
    }

    setInterval(() => {
      function randomIntFromInterval(min, max) {
        // min and max included
        return Math.floor(Math.random() * (max - min + 1) + min);
      }

      const rndInt = randomIntFromInterval(1, 2);
      let imagnToUse = Bck11originalimgn;
      if (rndInt == 2) {
        imagnToUse = Bck11imagn;
      }
      this.setState({
        overlapGroup: imagnToUse,
      });
    }, 2500);
  }


  render() {
    return (
      <div className="Advertisement" id="Advertisement-id">
        {this.state.sectionToShow == "image" && <img src={this.state.overlapGroup} />}
        {this.state.sectionToShow == "div" && (
          <div className="Advertisement-divSection" id="Advertisement-divSection">
            {this.state.hoverSec && <img src={this.state.overlapGroup} />}

            {!this.state.hoverSec &&
              <div
                style={{ backgroundImage: `url(${this.state.overlapGroup})` }}
                className="overlap-group-40">
              </div>
            }

            <div>
              <TextField
                className="Advertisement-textField"
                value={this.state.orderId}
                placeholder="Enter Order Id **"
                style={{ backgroundColor: '#fff', marginTop: this.state.textFieldTop, marginLeft: this.state.textFieldLft }}
              />
            </div>

            {this.state.hoverSec && <img src={this.state.overlapGroup == Bck11originalimgn ? Bck11imagn : Bck11originalimgn} />}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let Advertisement = withRouter(
  connect(mapStateToProps)(ConnectedAdvertisement)
);
export default withRouter(Advertisement);
