import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

import './HomePage.css';

class ConnectedHomePage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leftText: '',
      rightText: '',
      leftCounter: 0,
      rightCounter: 0,
    };
  }

  componentDidMount() {
    this.typeWriter();
  }

  typeWriter = () => {
    const { leftText, rightText, leftCounter, rightCounter } = this.state;
    const leftMessage = 'ryting';
    const rightMessage = 'ryeading?';

    if (leftCounter < leftMessage.length) {
      this.setState({
        leftText: leftText + leftMessage.charAt(leftCounter),
        leftCounter: leftCounter + 1,
      });
    }

    if (rightCounter < rightMessage.length) {
      this.setState({
        rightText: rightText + rightMessage.charAt(rightCounter),
        rightCounter: rightCounter + 1,
      });
    }

    setTimeout(this.typeWriter, 150);
  };

  render() {
    const { leftText, rightText } = this.state;
    return (
      <div className="HomePage">
        <div className="HomePage__left-side">
          <div className="HomePage__left-side-a" onClick={() => this.props.changePage("newscript")}>
            <h1 className="HomePage__text HomePage__text--glossy">{leftText}</h1>
          </div>
        </div>
        <div className="HomePage__demarcation">
          <div className="HomePage-or">or</div>
        </div>
        <div className="HomePage__right-side">
          <div className="HomePage__right-side-a" onClick={() => this.props.changePage("searchscripts")}>
            <h1 className="HomePage__text HomePage__text--glossy">{rightText}</h1>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let HomePage = withRouter(connect(mapStateToProps)(ConnectedHomePage));
export default withRouter(HomePage);

