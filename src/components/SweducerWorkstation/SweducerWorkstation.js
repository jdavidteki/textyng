import React, { Component } from 'react';
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";

import './SweducerWorkstation.css';

class ConnectedSweducerWorkstation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentTweetIndex: 0,
      currentMediumPostIndex: 0,
      updatedJson: props.location?.state?.jsonOfLife || {}, // Access jsonOfLife from the location state
      error: null,
    };
    this.handleTweetNavigation = this.handleTweetNavigation.bind(this);
    this.handleMediumPostNavigation = this.handleMediumPostNavigation.bind(this);
    this.updateStateForFutureLine = this.updateStateForFutureLine.bind(this);
  }

  componentDidMount() {
    console.log("this.props.location.state.jsonOfLife", this.props.location?.state?.jsonOfLife);
  }

  componentDidUpdate(prevProps) {
    // If the location state changes (for example, on navigation), update the state accordingly
    if (prevProps.location?.state?.jsonOfLife !== this.props.location?.state?.jsonOfLife) {
      this.setState({ updatedJson: this.props.location?.state?.jsonOfLife });
    }
  }

  handleTweetNavigation(direction) {
    const { currentTweetIndex, updatedJson } = this.state;
    const tweets = updatedJson?.tweets || [];

    let newIndex = currentTweetIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= tweets.length) newIndex = tweets.length - 1;

    this.setState({ currentTweetIndex: newIndex });
  }

  handleMediumPostNavigation(direction) {
    const { currentMediumPostIndex, updatedJson } = this.state;
    const mediumPosts = updatedJson?.mediumPosts || [];

    let newIndex = currentMediumPostIndex + direction;
    if (newIndex < 0) newIndex = 0;
    if (newIndex >= mediumPosts.length) newIndex = mediumPosts.length - 1;

    this.setState({ currentMediumPostIndex: newIndex });
  }

  updateStateForFutureLine(newState) {
    const { updatedJson } = this.state;

    // Update the state with the new future line
    this.setState({ updatedJson: { ...updatedJson, ...newState } });

    // Optionally, call a method to notify other components or update a database
    alert('State updated successfully!');
  }

  render() {
    const { updatedJson, currentTweetIndex, currentMediumPostIndex, error } = this.state;
    const tweets = updatedJson?.tweets || [];
    const mediumPosts = updatedJson?.mediumPosts || [];

    if (error) {
      return <div className="SweducerWorkstation-error">{error}</div>;
    }

    const currentTweet = tweets[currentTweetIndex];
    const currentMediumPost = mediumPosts[currentMediumPostIndex];

    return (
      <div className="SweducerWorkstation-container l-container">
        <h2>Sweducer Workstation</h2>

        <div className="SweducerWorkstation-content">
          <div className="SweducerWorkstation-tweet">
            <h3>Current Tweet</h3>
            {currentTweet ? (
              <div>
                <p>{currentTweet.text}</p>
                <p><strong>Hashtags:</strong> {currentTweet.hashtags.join(', ')}</p>
              </div>
            ) : (
              <p>No tweets available.</p>
            )}
          </div>

          <div className="SweducerWorkstation-medium-post">
            <h3>Current Medium Post</h3>
            {currentMediumPost ? (
              <div>
                <h4>{currentMediumPost.title}</h4>
                <a href={currentMediumPost.href} target="_blank" rel="noopener noreferrer">
                  Read Full Post
                </a>
                <p><strong>Tags:</strong> {currentMediumPost.tags.join(', ')}</p>
              </div>
            ) : (
              <p>No Medium posts available.</p>
            )}
          </div>
        </div>

        <div className="SweducerWorkstation-controls">
          <div className="SweducerWorkstation-navigation">
            <button onClick={() => this.handleTweetNavigation(-1)}>Previous Tweet</button>
            <button onClick={() => this.handleTweetNavigation(1)}>Next Tweet</button>
          </div>
          <div className="SweducerWorkstation-navigation">
            <button onClick={() => this.handleMediumPostNavigation(-1)}>Previous Post</button>
            <button onClick={() => this.handleMediumPostNavigation(1)}>Next Post</button>
          </div>
        </div>

        <div className="SweducerWorkstation-update">
          <h3>Update Future Line</h3>
          <textarea
            placeholder="Update the narrative for future lines"
            rows="4"
            onChange={(e) => this.updateStateForFutureLine({ futureLine: e.target.value })}
          ></textarea>
          <button onClick={() => this.updateStateForFutureLine({ futureLine: this.state.updatedJson.futureLine })}>
            Save Changes
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
    return {};
  };
  
  let SweducerWorkstation = withRouter(connect(mapStateToProps)(ConnectedSweducerWorkstation));
  export default withRouter(SweducerWorkstation);
  
  