import React, { Component } from "react";
import TextField from "@material-ui/core/TextField";
import Firebase from "../../firebase/firebase.js";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Splash from "../Splash/Splash.js"

import "./HomePage.css";

class ConnectedHomePage extends Component{
  constructor(props){
    super(props);

    this.state = {
      rimis: [],
      rimisIds: [],
      filteredRimis: [],
      rimiToShow: null,
      animateGreeting: "HomePage-animategreeting",
      orderId: ""
    }
  }

  int1 = null
  int2 = null
  int3 = null

  componentDidMount(){
    //hack: use this to fix github pages doing ?/ on pages
    if (window.location.href.includes("?/")){
      let actualDestination = window.location.href.split("?/")[1]

      this.props.history.push({
        pathname: "/" + actualDestination
      });
    }

    setTimeout(() => {
      document.getElementById("homePageGreeting").classList.add('HomePage-animategreeting');
    }, 500)


    this.int1 = setInterval(() => {
      if(document.querySelector(".HomePage-option:nth-child(1)") != undefined){
          document.querySelector(".HomePage-option:nth-child(1)").classList.toggle("hover")
          setTimeout(()=>{},1000);
      }
    }, 3000);

    this.int2 = setInterval(() => {
        if(document.querySelector(".HomePage-option:nth-child(2)") != undefined){
            document.querySelector(".HomePage-option:nth-child(2)").classList.toggle("hover")
            setTimeout(()=>{},1000);
        }
    }, 6000);

    this.int3 = setInterval(() => {
        if(document.querySelector(".HomePage-option:nth-child(3)") != undefined){
            document.querySelector(".HomePage-option:nth-child(3)").classList.toggle("hover")
            setTimeout(()=>{},1000);
        }
    }, 9000);

    this.int3 = setInterval(() => {
      if(document.querySelector(".HomePage-option:nth-child(4)") != undefined){
          document.querySelector(".HomePage-option:nth-child(4)").classList.toggle("hover")
          setTimeout(()=>{},1000);
      }
    }, 1200);
  }

  componentWillUnmount(){
    clearInterval(this.int1)
    clearInterval(this.int2)
    clearInterval(this.int3)
  }


  checkOrder(orderId){
    let errorMsg = "Invalid order ID: correct ID will direct you to order page. We sent ID to your email address"


    this.setState({orderId: orderId},
      () => {
        if (orderId == "1"){
          this.props.history.push({
            pathname: `/admin/1`
          });
        }
        else if (orderId.length == 0){
          this.setState({errorMsg: ""})
        } else if (orderId.length < 10){
          this.setState({errorMsg: errorMsg})
        } else{
          Firebase.getReelOrderById(orderId)
          .then(val => {
            if (val != null && val.id != undefined){
              this.props.history.push({
                pathname: `/orders/${val.id}`
              });
            }else{
              this.setState({errorMsg: errorMsg})
            }
          })
        }
      }
    )
  }

  render(){
    return (
      <div className="HomePage">
        <div className="HomePage-splash">
          <div className="HomePage-backgroundOverlay"></div>
          <Splash />
        </div>
        <div className="HomePage-container">
          <div className="HomePage-greeting" id="homePageGreeting">
            <h1>Welcome! I am Bola, Basi's Assistant</h1>
            <h3>How may I help you?</h3>
          </div>
          <div className="HomePage-options">
            <div className="HomePage-option">
              <span>Check my order progress</span>
              <TextField
                value={this.state.orderId}
                placeholder="Enter Order Id **"
                style={{ marginTop: 16}}
                onChange={(e) => {
                  this.checkOrder(e.target.value);
                }}
              />
              {this.state.errorMsg &&
                <span className="HomePage-errorMsg">
                  {this.state.errorMsg}
                </span>
              }
            </div>
            <div className="HomePage-option" onClick={() => this.props.changePage("purchasereel")}>
              I want to make an order
            </div>
            <div className="HomePage-option" onClick={() => location.href = `https://cash.app/$Basiratharoon/10`}>
              I want to make Cash App Payment
              <span className="HomePage-cashAppField">**Please ensure to enter your order ID into CashApp's 'For:' field.</span>
            </div>
            <div className="HomePage-option" onClick={() => location.href = `https://www.instagram.com/Basis_kitchen/?hl=en`}>
              I want to feed my eyes
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

let HomePage = withRouter(connect(mapStateToProps)(ConnectedHomePage));
export default withRouter(HomePage);
