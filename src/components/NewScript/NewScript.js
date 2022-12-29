import React, { Component } from "react";
import TextField from "@material-ui/core/TextField";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Script from "../Script/Script.js";
import EditableField from "../EditableField/EditableField";
import CastMembers from "../CastMembers/CastMembers";
import MsgTypes from "../MsgTypes/MsgTypes";
import Button from "@material-ui/core/Button";
import TimeInput from "../TimeInput/TimeInput.js"

var textyng = new Script("NewScript");

import "./NewScript.css";

class ConnectedNewScript extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rimis: [],
      rimisIds: [],
      filteredRimis: [],
      rimiToShow: null,
      animateGreeting: "NewScript-animategreeting",
      orderId: "",
      script: textyng,
      selectedCastId: 1,
      selectedMsgType: "",
      timeSinceLastMsg: "",
      textMsg: "",
      allMessages: [],
      spslm: 0,
    };
  }

  componentDidMount() {
    window.setInterval(function() {
      var elem = document.getElementById('NewScript-chatArea-id');
      elem.scrollTop = elem.scrollHeight;
    }, 500);

    window.setInterval(() => {
      this.setState(prevState => {
        return {spslm: prevState.spslm + 1} //TODO: make it so that TimeInput updates automatically
      })
    }, 1000);
  }

  getScriptName = (name) => {
    this.state.script.UpdateScriptName(name[1])
  }

  getAllCast = (cast) => {
    this.state.script.updateCast(cast)
  }

  getSelectedCast = (cast) => {
    this.setState({selectedCastId: cast.id}, () => {
      this.setState({allMessages: this.state.script.getAllMessagesStringListBySenderId(cast.id)})
    })
  }

  getSelectedMsgType = (value) => {
    this.setState({ textMsg: value}, () => {
      this.addNewMessage()
    });
  }

  addNewMessage = () => {
    var milliseconds = Math.floor(Date.now() / 1000)

    let tslmsg = this.state.timeSinceLastMsg
    if(tslmsg == "" || tslmsg == 0){
      tslmsg = this.state.spslm
    }

    let msgData = {
      id: milliseconds,
      timeStamp: milliseconds,
      content: this.state.textMsg,
      senderId: this.state.selectedCastId,
      tslmsg: tslmsg,
    }

    this.state.script.addNewMessage(msgData)
    this.setState({
      allMessages: this.state.script.getAllMessagesStringListBySenderId(this.state.selectedCastId),
      textMsg: "",
      spslm: 0,
    })
  }

  getInputTime = (timeInSeconds) => {
    this.setState({
      timeSinceLastMsg: timeInSeconds,
    })
  }

  render() {
    return (
        <div className="NewScript">
            <div className="NewScript-container l-container">
                <div className="NewScript-title">
                    <EditableField getScriptName={this.getScriptName}/>
                </div>
                <div className="NewScript-cast">
                    <CastMembers selectedCast={this.getSelectedCast} getAllCast={this.getAllCast}/>
                </div>
                <div className="NewScript-textView">
                  <MsgTypes selectedMsgType={this.getSelectedMsgType} />

                  <div id="NewScript-chatArea-id" className="NewScript-chatArea">
                    {this.state.allMessages.map((value,index) => (
                      <div key={index} className="NewScript-chatArea-msg">
                        {value.content}
                      </div>
                    ))}
                  </div>

                  <div className="NewScript-sendMessage">
                    <TextField
                      variant="outlined"
                      className="NewScript-sendMessage--input"
                      value={this.state.textMsg}
                      placeholder="Type message here"
                      onChange={e => {
                        this.setState({ textMsg: e.target.value });
                      }}
                    />
                    <TimeInput inputTime={this.getInputTime} />
                  </div>

                  <div className="NewScript-saveSubmit">
                    <div>
                      <Button
                        className="NewScript-saveSubmit--save"
                        variant="outlined"
                        color="primary"
                      >
                        save
                      </Button>

                      <Button
                        className="NewScript-saveSubmit--submit"
                        variant="outlined"
                        color="primary"
                        onClick={() => this.state.script.sendScriptToFirebase()}
                      >
                        submit
                      </Button>
                    </div>
                    <div>
                      <Button
                        className="NewScript-saveSubmit--send"
                        variant="outlined"
                        color="primary"
                        onClick={() => this.addNewMessage()}
                      >
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
            </div>
        </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let NewScript = withRouter(connect(mapStateToProps)(ConnectedNewScript));
export default withRouter(NewScript);
