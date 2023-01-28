import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import Firebase from "../../firebase/firebase";

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

    selectResult(id) {
        this.props.history.push({
            pathname: `/readerview/${id}`
        });
    }

    render() {
    return (
        <div className="search-scripts">
        <div className="search-bar" style={{ top: this.state.searchBarUp ? "-25%" : "-15%" }}>
            <input type="text" placeholder="what are you ryeading?" onChange={this.handleSearch} onFocus={this.handleFocus} onBlur={this.handleBlur} />
        </div>
        <div className="search-results">
            {this.state.results.map((result) => (
            <div className="search-eachResult" key={result.id} onClick={() => this.selectResult(result.id)}>
                <h3>{result.name}</h3>
                <p>{result.id}</p>
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

