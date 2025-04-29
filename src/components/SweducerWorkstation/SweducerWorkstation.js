import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { saveAs } from 'file-saver';

import './SweducerWorkstation.css';

function preprocessHeaven(rawHeaven) {
  if (rawHeaven.lines && rawHeaven.lines.length > 0) {
    return rawHeaven;
  }

  const parsedLines = [];

  for (const tweet of rawHeaven.tweets || []) {
    tweet.x = ''; // origin coordinates
    tweet.y = '';
    tweet.z = '';

    const fragments = tweet.text
      .split(/-\s*/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    for (const fragment of fragments) {
      parsedLines.push({
        text: fragment,
        tweet: tweet.text,
        primaryEmotion: '',
        secondaryEmotion: '',
        place: '',
        endX: '',
        endY: '',
        endZ: '',
        objectStates: ''
      });
    }
  }

  return {
    ...rawHeaven,
    lines: parsedLines
  };
}

function getHeavenData(source) {
  try {
    const saved = require('./savedHeaven.json');
    return preprocessHeaven(saved);
  } catch (err) {
    return preprocessHeaven(source || scrappedmedium);
  }
}

class ConnectedSweducerWorkstation extends Component {
  constructor(props) {
    super(props);
    const heaven = getHeavenData(props.location?.state?.heaven || props.heaven);
    const preprocessed = preprocessHeaven(heaven);

    this.state = {
      currentTweetIndex: 0,
      currentLineIndex: 0,
      updatedHeaven: preprocessed,
      editingData: {},
      error: null,
      successMessage: ''
    };
  }

  componentDidMount() {
    this.setInitialEditingData();
  }

  componentDidUpdate(prevProps, prevState) {
    const prevHeaven = prevProps.location?.state?.heaven;
    const newHeaven = this.props.location?.state?.heaven;

    if (JSON.stringify(prevHeaven) !== JSON.stringify(newHeaven)) {
      const preprocessed = preprocessHeaven(getHeavenData(newHeaven));
      this.setState({
        updatedHeaven: preprocessed,
        currentTweetIndex: 0,
        currentLineIndex: 0
      }, this.setInitialEditingData);
    }
  }

  setInitialEditingData = () => {
    const { updatedHeaven, currentTweetIndex, currentLineIndex } = this.state;
    const lines = updatedHeaven?.lines.filter(l => l.tweet === updatedHeaven.tweets[currentTweetIndex].text);
    this.setState({
      editingData: lines[currentLineIndex] || {}
    });
  }

  navigateTweet(direction) {
    this.saveCurrentEdits(() => {
      this.setState((prevState) => {
        const newIndex = Math.max(0, Math.min(prevState.currentTweetIndex + direction, prevState.updatedHeaven.tweets.length - 1));
        return {
          currentTweetIndex: newIndex,
          currentLineIndex: 0
        };
      }, this.setInitialEditingData);
    });
  }

  navigateLine(direction) {
    this.saveCurrentEdits(() => {
      const { updatedHeaven, currentTweetIndex, currentLineIndex } = this.state;
      const linesInTweet = updatedHeaven.lines.filter(l => l.tweet === updatedHeaven.tweets[currentTweetIndex].text);
      const newLineIndex = Math.max(0, Math.min(currentLineIndex + direction, linesInTweet.length - 1));
      this.setState({
        currentLineIndex: newLineIndex,
        editingData: linesInTweet[newLineIndex] || {},
        successMessage: ''
      });
    });
  }

  updateEditingField(field, value) {
    this.setState(prev => ({
      editingData: {
        ...prev.editingData,
        [field]: value
      }
    }));
  }

  updateTweetField(field, value) {
    this.setState(prev => {
      const updatedTweets = [...prev.updatedHeaven.tweets];
      updatedTweets[prev.currentTweetIndex] = {
        ...updatedTweets[prev.currentTweetIndex],
        [field]: value
      };
      return {
        updatedHeaven: {
          ...prev.updatedHeaven,
          tweets: updatedTweets
        }
      };
    });
  }

  saveCurrentEdits(callback = () => {}) {
    const { updatedHeaven, editingData } = this.state;
    const updatedLines = updatedHeaven.lines.map(line =>
      line.text === editingData.text && line.tweet === editingData.tweet
        ? { ...line, ...editingData }
        : line
    );

    if (['endX', 'endY', 'endZ'].some(coord => isNaN(editingData[coord]))) {
      this.setState({ error: 'Line end coordinates must be numeric values.' });
      return;
    }

    this.setState({
      updatedHeaven: {
        ...updatedHeaven,
        lines: updatedLines
      },
      error: null,
      successMessage: 'Saved successfully! ✨'
    }, callback);
  }

  downloadHeaven = () => {
    const blob = new Blob([
      JSON.stringify(this.state.updatedHeaven, null, 2)
    ], { type: 'application/json' });
    saveAs(blob, 'savedHeaven.json');
  }

  render() {
    const { currentTweetIndex, currentLineIndex, updatedHeaven, editingData, error, successMessage } = this.state;
    const tweet = updatedHeaven.tweets[currentTweetIndex];
    const linesInTweet = updatedHeaven.lines.filter(l => l.tweet === tweet.text);
    const totalTweets = updatedHeaven.tweets.length;
    const totalLines = linesInTweet.length;

    return (
      <div className="SweducerWorkstation-container l">
        <h1>Sweducer Workstation ✨</h1>
        <h2>{updatedHeaven.title || 'Untitled Heaven'}</h2>

        {error && <div className="SweducerWorkstation-error">{error}</div>}
        {successMessage && <div className="SweducerWorkstation-success">{successMessage}</div>}

        <div className="SweducerWorkstation-line">
          <h3>Original Tweet</h3>
          <p><strong>Tweet:</strong> {tweet.text}</p>
          <div className="SweducerWorkstation-edit-coords">
            <input type="text" placeholder="Tweet X" value={tweet.x || ''} onChange={(e) => this.updateTweetField('x', e.target.value)} />
            <input type="text" placeholder="Tweet Y" value={tweet.y || ''} onChange={(e) => this.updateTweetField('y', e.target.value)} />
            <input type="text" placeholder="Tweet Z" value={tweet.z || ''} onChange={(e) => this.updateTweetField('z', e.target.value)} />
          </div>
          <p><strong>Fragment:</strong> {editingData.text}</p>
          <p><em>{`Tweet ${currentTweetIndex + 1} of ${totalTweets}, Line ${currentLineIndex + 1} of ${totalLines}`}</em></p>
        </div>

        <div className="SweducerWorkstation-edit">
          <h3>Place This Line in Heaven</h3>
          <input type="text" placeholder="Primary Emotion" value={editingData.primaryEmotion || ''} onChange={(e) => this.updateEditingField('primaryEmotion', e.target.value)} />
          <input type="text" placeholder="Secondary Emotion" value={editingData.secondaryEmotion || ''} onChange={(e) => this.updateEditingField('secondaryEmotion', e.target.value)} />
          <input type="text" placeholder="Place" list="places" value={editingData.place || ''} onChange={(e) => this.updateEditingField('place', e.target.value)} />
          <datalist id="places">
            {updatedHeaven.places?.map((p, i) => <option key={i} value={p} />)}
          </datalist>
          <input type="text" placeholder="End X-coordinate" value={editingData.endX || ''} onChange={(e) => this.updateEditingField('endX', e.target.value)} />
          <input type="text" placeholder="End Y-coordinate" value={editingData.endY || ''} onChange={(e) => this.updateEditingField('endY', e.target.value)} />
          <input type="text" placeholder="End Z-coordinate" value={editingData.endZ || ''} onChange={(e) => this.updateEditingField('endZ', e.target.value)} />
          <textarea rows="3" placeholder="Objects and States (example: 'cashier: bugged')" value={editingData.objectStates || ''} onChange={(e) => this.updateEditingField('objectStates', e.target.value)}></textarea>
          <button onClick={() => this.saveCurrentEdits()}>Save Annotation</button>
        </div>

        <div className="SweducerWorkstation-navigation">
          <button onClick={() => this.navigateLine(-1)} disabled={currentLineIndex === 0}>⬅ Previous Line</button>
          <button onClick={() => this.navigateLine(1)} disabled={currentLineIndex === totalLines - 1}>Next Line ➡</button>
        </div>

        <div className="SweducerWorkstation-preview">
          <h3>🔎 Preview Annotation</h3>
          <p><strong>Text:</strong> {editingData.text}</p>
          <p><strong>Primary Emotion:</strong> {editingData.primaryEmotion}</p>
          <p><strong>Secondary Emotion:</strong> {editingData.secondaryEmotion}</p>
          <p><strong>Place:</strong> {editingData.place}</p>
          <p><strong>End X:</strong> {editingData.endX} | <strong>Y:</strong> {editingData.endY} | <strong>Z:</strong> {editingData.endZ}</p>
          <p><strong>Object States:</strong> {editingData.objectStates}</p>
        </div>

        <div className="SweducerWorkstation-navigation">
          <button onClick={() => this.navigateTweet(-1)} disabled={currentTweetIndex === 0}>⬅ Previous Tweet</button>
          <button onClick={() => this.navigateTweet(1)} disabled={currentTweetIndex === totalTweets - 1}>Next Tweet ➡</button>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={this.downloadHeaven}>💾 Download Heaven JSON</button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({ });

const SweducerWorkstation = withRouter(connect(mapStateToProps)(ConnectedSweducerWorkstation));

export default SweducerWorkstation;

const scrappedmedium = {
  "title": "technicalities of a time traveling device",
  "tweets": [
    {
      "text": "- ayam a user and this is my story-- hi, user",
      "hashtags": [
        "ttb",
        "abeokutakodes"
      ]
    },
    {
      "text": "- i miss it already #humanity",
      "hashtags": []
    }
  ]
};
