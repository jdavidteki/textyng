import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import Firebase from "../../firebase/firebase.js";
import Heaven from "../Heaven/Heaven.js";
import EditScript from "../EditScript/EditScript.js";
import { cleanTimeTravelCode } from "../../Helpers/Helpers.js";

import "./Durella.css";

function getFallbackHeavenData() {
  try {
    return require('./heavenFromAI.json');
  } catch (err) {
    console.error('Failed to load fallback heaven data:', err);
    return null;
  }
}

async function saveHeavenData(data, filename = 'heavenFromAI.json', heavenId) {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const field = filename === 'timetravel.js' ? 'timetravelfile' : 'heavenData';
  try {
    await Firebase.saveHeavenData(heavenId, content, field);
    console.log(`Saved ${filename} to Realtime Database at /heavens/${heavenId}/${field}`);
    return true;
  } catch (err) {
    console.error(`Failed to save ${filename} to Realtime Database:`, err);
    return false;
  }
}

class ConnectedDurella extends Component {
  constructor(props) {
    super(props);
    this.state = {
      heaven: null,
      script: null,
      scriptId: null,
      heavenId: null,
      timeTravelCode: '',
      newTimeTravelCode: '',
      currentGoal: null,
      loadingProgress: 0,
      error: null,
      scriptLoaded: false,
    };
    console.log('Durella constructor, heavenId:', this.props.match.params.id);
  }

  async componentDidMount() {
    const heavenId = this.props.match.params.id || null;
    await this.loadHeavenData(heavenId);
  }

  async componentDidUpdate(prevProps) {
    const currentHeavenId = this.props.match.params.id || null;
    const prevHeavenId = prevProps.match.params.id || null;
    if (currentHeavenId !== prevHeavenId && currentHeavenId !== this.state.heavenId) {
      console.log('Durella route changed, reloading heaven data for ID:', currentHeavenId);
      await this.loadHeavenData(currentHeavenId);
    }
  }

  async loadHeavenData(heavenId) {
    console.log('Durella loadHeavenData start, heavenId:', heavenId);
    this.setState({
      heavenId,
      loadingProgress: 10,
      error: null,
      script: null,
      scriptId: null,
      heaven: null,
      timeTravelCode: '',
      currentGoal: null,
      scriptLoaded: false,
    });

    let heaven;
    try {
      heaven = await Heaven.create(heavenId, getFallbackHeavenData());
    } catch (error) {
      console.error(`Error initializing Durella Heaven for ID: ${heavenId || 'fallback'}:`, error);
      this.setState({
        error: "Failed to initialize Heaven. Please check your journey ID.",
        loadingProgress: 100,
        scriptLoaded: false,
      });
      return;
    }

    let timeTravelCode = heaven.getTimeTravelFile();
    if (!timeTravelCode || typeof timeTravelCode !== 'string') {
      console.warn('No valid timetravelfile in Durella heaven data');
      timeTravelCode = '';
    }

    console.log('Raw timeTravelCode:', timeTravelCode);
    timeTravelCode = cleanTimeTravelCode(timeTravelCode);
    console.log('Cleaned timeTravelCode:', timeTravelCode);

    const currentGoal = heaven.getCurrentGoalInProgress();
    console.log('Current goal:', currentGoal);

    const script = heaven.getScript();
    const scriptId = heaven.data?.scriptId || null;
    console.log('Script from heaven.getScript:', script, 'scriptId:', scriptId);

    if (script && typeof script.id === 'string' && script.id && scriptId) {
      try {
        this.setState({
          heaven,
          timeTravelCode,
          script,
          scriptId,
          currentGoal: currentGoal || null,
          loadingProgress: 100,
          scriptLoaded: true,
        });
      } catch (err) {
        console.error('Durella script initialization error:', err, 'Script:', script);
        this.setState({
          heaven,
          timeTravelCode,
          error: 'Failed to load script data.',
          loadingProgress: 100,
          scriptLoaded: false,
        });
      }
    } else {
      console.error('Invalid script or missing script.id/scriptId:', script, scriptId);
      this.setState({
        heaven,
        timeTravelCode,
        error: 'Failed to load script data. Script is invalid or missing a valid ID.',
        loadingProgress: 100,
        scriptLoaded: false,
      });
    }
    console.log('Durella loadHeavenData end, script:', this.state.script, 'scriptId:', this.state.scriptId, 'scriptLoaded:', this.state.scriptLoaded);
  }

  handleTimeTravelCodeChange = (e) => {
    this.setState({ newTimeTravelCode: e.target.value });
  };

  saveTimeTravelCode = async () => {
    const { heaven, newTimeTravelCode, heavenId } = this.state;
    if (!newTimeTravelCode) {
      alert('Please enter a valid timetravel.js code.');
      return;
    }

    try {
      const cleanedCode = cleanTimeTravelCode(newTimeTravelCode);
      console.log('Saving cleaned timetravel.js:', cleanedCode);
      await heaven.setTimeTravelFile(cleanedCode);
      await Firebase.database().ref(`/heavens/${heavenId}/timetravelfile`).set(cleanedCode, (error) => {
        if (error) {
          console.error('Error saving timetravelfile:', error);
          throw error;
        }
      });
      this.setState({ timeTravelCode: cleanedCode, newTimeTravelCode: '' });
      alert('timetravel.js updated successfully.');
    } catch (error) {
      console.error('Error saving timetravel.js:', error);
      alert('Failed to update timetravel.js.');
    }
  };

  saveScriptToJson = async () => {
    const { heaven, script, heavenId } = this.state;
    if (!script || typeof script.id !== 'string' || !script.id) {
      console.error('Cannot save script: Invalid script or missing id:', script);
      this.setState({ error: 'Failed to save script: Script ID is missing or invalid.' });
      return;
    }
    try {
      await heaven.updateHeavenFirebase();
      await saveHeavenData(heaven.getAllData(), 'heavenFromAI.json', heavenId);
      console.log('Script saved to Firebase');
    } catch (error) {
      console.error('Error saving script:', error, 'Script:', script);
      this.setState({ error: 'Failed to save script.' });
    }
  };

  shouldComponentUpdate(nextProps, nextState) {
    return (
      this.state.heavenId !== nextState.heavenId ||
      this.state.script !== nextState.script ||
      this.state.scriptId !== nextState.scriptId ||
      this.state.loadingProgress !== nextState.loadingProgress ||
      this.state.error !== nextState.error ||
      this.state.timeTravelCode !== nextState.timeTravelCode ||
      this.state.newTimeTravelCode !== nextState.newTimeTravelCode ||
      this.state.currentGoal !== nextState.currentGoal ||
      this.state.scriptLoaded !== nextState.scriptLoaded
    );
  }

  render() {
    const { heaven, script, scriptId, timeTravelCode, newTimeTravelCode, currentGoal, loadingProgress, error, scriptLoaded } = this.state;
    console.log('Durella render, script:', script, 'scriptId:', scriptId, 'scriptLoaded:', scriptLoaded, 'loadingProgress:', loadingProgress, 'error:', error);

    if (loadingProgress < 100 || !scriptLoaded) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-semibold mb-4">Loading Durella...</h2>
          <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-gray-600">{loadingProgress}% Complete</p>
        </div>
      );
    }

    if (error) {
      return <div className="p-4 text-red-500">{error}</div>;
    }

    return (
      <div className="Durella p-4">
        <h2 className="text-2xl font-semibold mb-4">{heaven?.getTitle() || "Durella - Antagonist System"}</h2>

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Current Goal in Progress</h3>
          {currentGoal ? (
            <p className="text-lg">{currentGoal}</p>
          ) : (
            <p>No goal currently in progress.</p>
          )}
        </div>

        {script && typeof script.id === 'string' && script.id && scriptLoaded && (
          <div className="mb-6">
            <h3 className="text-xl font-medium mb-2">Edit Script</h3>
            <EditScript
              key="edit-script"
              isNewScript={true}
              script={script}
            />
          </div>
        )}

        <div className="mb-6">
          <h3 className="text-xl font-medium mb-2">Update timetravel.js</h3>
          <textarea
            className="w-full p-2 border rounded mb-2"
            rows="10"
            value={newTimeTravelCode || timeTravelCode}
            onChange={this.handleTimeTravelCodeChange}
            placeholder="Enter timetravel.js code..."
          />
          <button
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={this.saveTimeTravelCode}
          >
            Save timetravel.js
          </button>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

let Durella = withRouter(connect(mapStateToProps)(ConnectedDurella));
export default withRouter(Durella);

