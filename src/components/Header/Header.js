import React, { Component } from "react";
import logo from '../../assets/logos/logo.png';

import { GetSvgIcon } from "../../Helpers/Helpers.js";

import "./Header.css";

class Header extends Component{
  constructor(props){
    super(props);

    this.state = {
      catSelected: "textyng",
    }
  }

  handleCategoryClick(catSelected){
    this.setState({
      createIconHover: "black",
      meCardsIconHover: "black",
    })


    if(catSelected == "readerview"){
      this.setState({ createIconHover: "#DCB69A"})
    }else if(catSelected == "mecards"){
      this.setState({ meCardsIconHover: "#DCB69A"})
    }

    this.props.changePage(catSelected)
  }

  componentDidMount(){
    let path = window.location.pathname;
    this.setState({
      createIconHover: path.includes("readerview/") ? "#DCB69A" : 'black',
      meCardsIconHover: path.includes("mecards/") ? "#DCB69A" : 'black',
    })

    let element = document.getElementById("Header-logo");
    setInterval(function() {
      let randomInterval = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      setTimeout(function() {

        let currentBorderRadius = element.style.borderRadius;
        if (currentBorderRadius === "25%") {
          element.style.borderRadius = "0";
        } else {
          element.style.borderRadius = "25%";
        }

      }, randomInterval);
    }, 4000); // 1000 milliseconds = 1 second
  }

  render(){
    return (
      <div className="Header">
        <div className="Header-logoWrapper" onClick={() => this.handleCategoryClick("textyng")}>
          <img id="Header-logo" className="Header-logo" src={logo} alt="textyng.me.logo" />
        </div>
        <div className="Header-mainMenu">
          <div className="Header-mainMenu-item Header-icon" onClick={() => this.handleCategoryClick("searchscripts")}>
            {GetSvgIcon("createIcon", this.state.createIconHover)}
            <span className="Header-img-title">scripts</span>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
