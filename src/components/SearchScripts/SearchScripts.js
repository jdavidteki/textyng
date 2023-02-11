import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Firebase from "../../firebase/firebase";
import { ConvertSecondsToDate } from "../../Helpers/Helpers.js";

import "./SearchScripts.css";

class ConnectedSearchScripts extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchBarUp: false,
            results: [],
            searchTerm: "",
            scripts: [],
        };
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.selectResult = this.selectResult.bind(this);
    }

    componentDidMount(){
       Firebase.getScripts().then( val => {
        console.log("val", val)
        this.setState({
            scripts: val,
            results: val
        })
       })
    }


    handleSearch(e) {
        this.setState({
            searchTerm: e.target.value,
        });

        if (this.state.scripts) {
            const results = this.state.scripts.filter((item) =>
            item.name.toLowerCase().includes(e.target.value.toLowerCase())
            )
            this.setState({ results });
        } else {
            console.log('data is not defined');
        }

        if(e.target.value == ""){
            this.setState({ results: this.state.scripts });
        }
    }

    handleFocus() {
        this.setState({ searchBarUp: true });
    }

    handleBlur() {
        if(!this.state.results.length){
            this.setState({ searchBarUp: false });
        }
    }

    selectResult(id, isPrivateScript) {
        if(isPrivateScript){
            var tenure = prompt("Please enter master password to read private", "");
            if (tenure != null && tenure == "7779") {
                this.props.history.push({
                    pathname: `/readerview/${id}`
                });
            }
        }else{
            this.props.history.push({
                pathname: `/readerview/${id}`
            });
        }
    }

    render() {
    return (
        <div className="SearchScripts-scripts">
        <div className="SearchScripts-bar" style={{ top: this.state.searchBarUp ? "-25%" : "-15%" }}>
            <input type="text" placeholder="what are you ryeading?" onChange={this.handleSearch} onFocus={this.handleFocus} onBlur={this.handleBlur} />
        </div>
        <div className="SearchScripts-results">
            {this.state.results.map((result) => (
            <div className="SearchScripts-eachResult" key={result.id} onClick={() => this.selectResult(result.id, result.isPrivateScript)}>
                <h3>{result.name}</h3>
                <p className="SearchScripts-eachResult-dateCreated">{ConvertSecondsToDate(result.dateCreated)}</p>
            </div>
            ))}
        </div>
        </div>
    );
    }
}


const mapStateToProps = (state) => {
  return {};
};

let SearchScripts = withRouter(connect(mapStateToProps)(ConnectedSearchScripts));
export default withRouter(SearchScripts);

