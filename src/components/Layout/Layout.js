import React, { Component } from "react";
import Footer from "../Footer/Footer.js";
import Header  from "../Header/Header.js";
import NewScript from "../NewScript/NewScript.js"
import ReaderView from "../ReaderView/ReaderView.js"
import EditScript from "../EditScript/EditScript.js"

import "./Layout.css";


class Layout extends Component{
  constructor(props){
    super(props);

    this.state = {
        pageName: this.props.pageName
    }
  }

  componentDidMount(){
    document.getElementById("layoutContent").classList.add(this.state.pageName);
  }

  componentDidUpdate(){

    const layoutContent = document.getElementById("layoutContent")

    layoutContent.className = ''

    layoutContent.classList.add("Layout-content")
    layoutContent.classList.add(this.state.pageName);
  }

  changePage = (pageToChange) => {
    window.history.pushState('', 'New Page Title', '/' + pageToChange);
    this.setState({pageName: pageToChange})
  }

  render(){
    return (
        <div className="Layout">
            <div className="Layout-header">
                <Header changePage={this.changePage}/>
            </div>
            <div className="Layout-content" id="layoutContent">
                {this.state.pageName == "textyng" &&
                    <NewScript changePage={this.changePage}/>
                }
                {this.state.pageName == "newscript" &&
                    <NewScript changePage={this.changePage}/>
                }
                {this.state.pageName == "readerview" &&
                    <ReaderView changePage={this.changePage}/>
                }
                {this.state.pageName == "editscript" &&
                    <EditScript changePage={this.changePage}/>
                }
            </div>
            <div className="Layout-footer">
                <Footer />
            </div>
        </div>
    )}
}

export default Layout;
