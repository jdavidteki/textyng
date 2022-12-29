import React, { Component } from "react";
import logo from '../../assets/logos/logo.png';

import { GetSvgIcon } from "../../Helpers/Helpers.js";

import "./Header.css";

class Header extends Component{
  constructor(props){
    super(props);

    this.state = {
      catSelected: "textyng",
      findMeIconHover: "#800020",
    }
  }

  handleCategoryClick(catSelected){
    this.setState({
      findMeIconHover: "black",
      createIconHover: "black",
      meCardsIconHover: "black",
    })

    if(catSelected == "textyng"){
      this.setState({ findMeIconHover: "#800020"})
    }else if(catSelected == "aboutme"){
      this.setState({ createIconHover: "#800020"})
    }else if(catSelected == "mecards"){
      this.setState({ meCardsIconHover: "#800020"})
    }

    this.props.changePage(catSelected)
  }

  componentDidMount(){
    let path = window.location.pathname;
    this.setState({
      findMeIconHover: path.includes("textyng/") || path.includes("rimicard") ? "#800020" : 'black',
      createIconHover: path.includes("aboutme/") ? "#800020" : 'black',
      meCardsIconHover: path.includes("mecards/") ? "#800020" : 'black',
    })

    let element = document.getElementById("Header-logo");
    setInterval(function() {
      let randomInterval = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
      setTimeout(function() {

        let currentBorderRadius = element.style.borderRadius;
        if (currentBorderRadius === "25%") {
          element.style.borderRadius = "50%";
        } else {
          element.style.borderRadius = "25%";
        }

      }, randomInterval);
    }, 10000); // 1000 milliseconds = 1 second
  }

  render(){
    return (
      <div className="Header">
        <div className="Header-logoWrapper" onClick={() => this.handleCategoryClick("textyng")}>
          <img id="Header-logo" className="Header-logo" src={logo} alt="textyng.me.logo" />
        </div>
        <div className="Header-mainMenu">
          <div className="Header-mainMenu-item Header-icon" onClick={() => this.handleCategoryClick("textyng")}>
            {GetSvgIcon("findMeIcon", this.state.findMeIconHover)}
            <span className="Header-img-title">textyng!</span>
          </div>
          <div className="Header-mainMenu-item Header-icon" onClick={() => this.handleCategoryClick("aboutme")}>
            {GetSvgIcon("createIcon", this.state.createIconHover)}
            <span className="Header-img-title">about.me</span>
          </div>
        </div>
      </div>
    );
  }
}

export default Header;
