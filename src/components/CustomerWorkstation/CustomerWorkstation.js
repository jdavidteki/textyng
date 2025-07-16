import React, { Component } from "react";
import { connect } from "react-redux";
import { withRouter } from "react-router-dom";
import EditScript from "../EditScript/EditScript.js";
import confetti from "canvas-confetti";
import Heaven from "../Heaven/Heaven.js";
import GoalManager from "./GoalManager.js";
import firebase from "../../firebase/firebase.js";

import "./CustomerWorkstation.css";

function getFallbackHeavenData() {
  try {
    const data = require("./heavenFromAI.json");
    return {
      ...data,
      manifestationHistory: Array.isArray(data.manifestationHistory) ? data.manifestationHistory : [],
    };
  } catch (err) {
    console.error("Failed to load fallback heaven data:", err);
    return {
      id: `heaven-${Math.floor(Date.now() / 1000)}`,
      title: "Untitled Heaven",
      dateCreated: Math.floor(Date.now() / 1000),
      scriptId: null,
      tweets: [],
      lines: {},
      stateSnapshots: [],
      manifestationHistory: [],
      currentGoalInProgress: null,
    };
  }
}

class ConnectedCustomerWorkstation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      heaven: null,
      script: null,
      scriptId: null,
      manifestationActions: [],
      manifestationHistory: [],
      isValidating: false,
      allMessages: [],
      selectedCastId: null,
      selectedSceneId: null,
      cast: [],
      scenes: [],
      stateSnapshots: [],
      activeAction: null,
      timeMachineDestination: null,
      movementHistory: [],
      heavenId: null,
      loadingProgress: 0,
      selectedCharacterId: null,
      selectedTimestamp: new Date().toISOString().slice(0, 16),
      commandInput: "",
      error: null,
      visualData: { url: null, type: null, images: null },
    };
  }

  async componentDidMount() {
    const heavenId = this.props.match.params.id || null;
    this.setState({ heavenId, loadingProgress: 10 });

    let heaven;
    try {
      heaven = await Heaven.create(heavenId, getFallbackHeavenData(), true);
      if (heaven.data?.scriptId) {
        await heaven.loadScript();
      }

      const lines = heaven.getLines() || {};
      const lineKeys = Object.keys(lines).map(Number);

      let goalInProgress = heaven.getCurrentGoalInProgress();
      if (goalInProgress === undefined) {
        goalInProgress = await heaven.getCurrentGoalInProgress();
      }

      if (goalInProgress === null || !lines[goalInProgress]) {
        if (lineKeys.length > 0) {
          goalInProgress = Math.min(...lineKeys);
          await heaven.setCurrentGoalInProgress(goalInProgress);
        } else {
          goalInProgress = null;
        }
      }

      const manifestationHistory = heaven.getManifestationHistory() || [];
      console.debug("Loaded manifestationHistory:", manifestationHistory);

      this.setState({
        heaven,
        manifestationHistory,
        movementHistory: await heaven.thrydObjects.getHistory(heavenId, 10),
        timeMachineDestination: heaven.thrydObjects?.timeMachine?.getDestination() || null,
        loadingProgress: 50,
      });
    } catch (error) {
      console.error(`Error initializing Heaven for ID: ${heavenId || "fallback"}:`, error);
      this.setState({
        error: `Initialization failed: ${error.message}`,
        loadingProgress: 50,
      });
      heaven = await Heaven.create(null, getFallbackHeavenData(), true);
      this.setState({
        heaven,
        manifestationHistory: heaven.getManifestationHistory() || [],
        movementHistory: await heaven.thrydObjects.getHistory(null, 10),
      });
    }

    const script = heaven.getScript();
    const scriptId = heaven.data?.scriptId || null;
    if (script && scriptId && heaven.getAllData()) {
      try {
        this.setState({
          script,
          scriptId,
          cast: heaven.getCharacters() || [],
          scenes: script.getScenes() || [],
          allMessages: script.getAllMessagesAsNodes(),
          stateSnapshots: heaven.getStateSnapshots() || [],
          loadingProgress: 100,
        });
      } catch (err) {
        console.error("Script initialization error:", err);
        this.setState({ loadingProgress: 100, error: `Script initialization failed: ${err.message}` });
      }
    } else {
      this.setState({ loadingProgress: 100 });
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { script, allMessages, heaven } = this.state;
    if (script && script.getAllMessagesAsNodes().length > allMessages.length) {
      this.setState({ allMessages: script.getAllMessagesAsNodes() });
    }
    if (heaven && prevState.heaven !== heaven) {
      heaven.thrydObjects.getHistory(this.state.heavenId, 10).then(history => {
        this.setState({ movementHistory: history });
      }).catch(error => {
        console.error("Failed to update movement history:", error);
        this.setState({ error: `Failed to update movement history: ${error.message}` });
      });
    }
  }

  handleGoalSelect = async (goalId, characterId, timestamp) => {
    const { heaven } = this.state;
    const lines = heaven?.getLines() || {};
    if (!lines[goalId]) {
      console.warn(`Goal ID ${goalId} not found`);
      this.setState({ error: `Goal ID ${goalId} not found` });
      return;
    }
    const place = lines[goalId].coordinates
      ? `(${lines[goalId].coordinates.x}, ${lines[goalId].coordinates.y}, ${lines[goalId].coordinates.z})`
      : "default";
    const sceneId =
      this.state.scenes.find((scene) => scene.name === place || scene.name === "default")?.id ||
      this.state.scenes[0]?.id;
    this.setState({
      selectedSceneId: sceneId,
      manifestationActions: [],
      activeAction: null,
      selectedTimestamp: timestamp ? new Date(timestamp).toISOString().slice(0, 16) : this.state.selectedTimestamp,
    });
    try {
      await heaven.setCurrentGoalInProgress(goalId);
      this.setState({ currentGoalInProgress: goalId });
    } catch (error) {
      console.error(`Error saving currentGoalInProgress ${goalId}:`, error);
      this.setState({ error: `Failed to select goal: ${error.message}` });
    }
  };

  handleCommandSubmit = async () => {
    const { heaven, commandInput, selectedSceneId, heavenId, currentGoalInProgress } = this.state;
    if (!heaven || !commandInput) {
      this.setState({ error: "No command provided or system not ready." });
      return;
    }
    try {
      const commandRegex = /^\w+\.\w+\(.*\);?$/;
      if (!commandRegex.test(commandInput)) {
        this.setState({ error: "Invalid command format. Use: context.action(params);" });
        return;
      }
      await heaven.executeY5Command(commandInput, heaven.getScript(), selectedSceneId || "scene-1");
      this.setState({
        commandInput: "",
        movementHistory: await heaven.thrydObjects.getHistory(heavenId, 10),
      });
      const result = await heaven.manifest(currentGoalInProgress, {}, [], selectedSceneId || "scene-1");
      this.setState({
        visualData: {
          url: result.visual,
          type: result.visualType,
          images: result.visualImages,
        },
      });
    } catch (err) {
      console.error("Failed to execute command:", err);
      this.setState({ error: `Command execution failed: ${err.message}` });
      await firebase.logError({
        type: "CommandExecutionError",
        message: `Failed to execute command: ${err.message}`,
        heavenId,
        timestamp: Date.now(),
      });
    }
  };

  manifest = async (customerCoords = {}) => {
    const { heaven, manifestationActions, selectedSceneId, selectedCharacterId, selectedTimestamp, heavenId } = this.state;
    const selectedGoalId = heaven.getCurrentGoalInProgress();
    if (selectedGoalId === null) {
      this.setState({ error: "Please select a goal." });
      return;
    }
    if (!selectedCharacterId) {
      this.setState({ error: "Please select a character." });
      return;
    }
    const timestamp = new Date(selectedTimestamp).getTime();
    if (timestamp < Date.now()) {
      this.setState({ error: "Timestamp cannot be in the past." });
      return;
    }

    this.setState({ isValidating: true });

    try {
      const result = await heaven.manifest(
        selectedGoalId,
        customerCoords,
        manifestationActions,
        selectedSceneId || "scene-1",
        selectedCharacterId,
        timestamp
      );

      this.setState({
        manifestationHistory: result.newHistory || this.state.manifestationHistory,
        manifestationActions: result.success ? [] : manifestationActions,
        selectedCastId: result.success ? null : this.state.selectedCastId,
        selectedSceneId: result.success ? null : this.state.selectedSceneId,
        activeAction: null,
        isValidating: false,
        movementHistory: await heaven.thrydObjects.getHistory(heavenId, 10),
        visualData: {
          url: result.visual,
          type: result.visualType,
          images: result.visualImages,
        },
      });

      await this.saveStateToJson();

      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 50,
          origin: { y: 0.6 },
        });
        alert(
          `Goal has manifested! Probability: ${result.probability.toFixed(2)}, Alignment: ${result.alignment.toFixed(2)}, Total Length: ${result.totalLength.toFixed(2)}`
        );
      } else {
        alert(
          result.error ||
            `Goal did not manifest. Probability: ${result.probability.toFixed(2)}, Alignment: ${result.alignment.toFixed(2)}, Total Length: ${result.totalLength.toFixed(2)}`
        );
      }
    } catch (error) {
      console.error("Error manifesting goal:", error);
      this.setState({ isValidating: false, activeAction: null, error: `Failed to manifest goal: ${error.message}` });
      await this.saveStateToJson();
      await firebase.logError({
        type: "ManifestationError",
        message: `Failed to manifest goal: ${error.message}`,
        heavenId,
        timestamp: Date.now(),
      });
    }
  };

  saveStateToJson = async () => {
    const { heaven, stateSnapshots, manifestationHistory, heavenId } = this.state;
    try {
      heaven.updateStateSnapshots(stateSnapshots);
      heaven.updateManifestationHistory(manifestationHistory);
      await heaven.updateHeavenFirebase();
      await heaven.saveHeavenData(heaven.getAllData());
      console.debug("Saved state to Firebase:", { manifestationHistory });
    } catch (error) {
      console.error("Failed to save state to Firebase:", error);
      this.setState({ error: `Failed to save state: ${error.message}` });
      await firebase.logError({
        type: "FirebaseSaveError",
        message: `Failed to save state: ${error.message}`,
        heavenId,
        timestamp: Date.now(),
      });
    }
  };

  saveScriptToJson = async () => {
    const { heaven, stateSnapshots, manifestationHistory, heavenId } = this.state;
    try {
      heaven.updateStateSnapshots(stateSnapshots);
      heaven.updateManifestationHistory(manifestationHistory);
      await heaven.updateHeavenFirebase();
      await heaven.saveHeavenData(heaven.getAllData());
      console.debug("Saved script to Firebase:", { manifestationHistory });
    } catch (error) {
      console.error("Failed to save script to Firebase:", error);
      this.setState({ error: `Failed to save script: ${error.message}` });
      await firebase.logError({
        type: "FirebaseSaveError",
        message: `Failed to save script: ${error.message}`,
        heavenId,
        timestamp: Date.now(),
      });
    }
  };

  render() {
    const {
      heaven,
      script,
      scriptId,
      manifestationActions,
      isValidating,
      allMessages,
      cast,
      scenes,
      activeAction,
      timeMachineDestination,
      movementHistory,
      selectedSceneId,
      loadingProgress,
      manifestationHistory,
      commandInput,
      error,
      visualData,
      currentGoalInProgress,
    } = this.state;

    if (loadingProgress < 100) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-semibold mb-4">Loading Journey...</h2>
          <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
          <p className="mt-2 text-gray-600">${loadingProgress}% Complete</p>
        </div>
      );
    }

    return (
      <div className="CustomerWorkstation">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {script && (
          <EditScript
            isNewScript={true}
            script={script}
            executeY5Command={(command, script, sceneId) =>
              heaven.executeY5Command(command, script, sceneId || selectedSceneId || "scene-1")
            }
          />
        )}
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Execute Command</h2>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => this.setState({ commandInput: e.target.value })}
            placeholder="e.g., tunde.newlocation({ x: 2, y: 3, z: 0 });"
            className="border p-2 mr-2"
          />
          <button
            onClick={this.handleCommandSubmit}
            className="bg-blue-500 text-white p-2 rounded"
          >
            Execute
          </button>
        </div>
        <GoalManager
          heaven={heaven}
          script={script}
          selectedGoalId={currentGoalInProgress}
          manifestationActions={manifestationActions}
          isValidating={isValidating}
          allMessages={allMessages}
          cast={cast}
          scenes={scenes}
          activeAction={activeAction}
          timeMachineDestination={timeMachineDestination}
          movementHistory={movementHistory}
          selectedSceneId={selectedSceneId}
          manifestationHistory={manifestationHistory}
          visualData={visualData}
          onGoalSelect={this.handleGoalSelect}
          onManifest={this.manifest}
          onSaveScriptToJson={this.saveScriptToJson}
          setState={(updates) => this.setState(updates)}
        />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {};
};

export default withRouter(connect(mapStateToProps)(ConnectedCustomerWorkstation));