import React, { Component } from "react";
import PropTypes from "prop-types";
import { Button, Tabs, Tab, Checkbox } from "@material-ui/core";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";
import ManifestButton from "./ManifestButton.js";

import "./GoalManager.css";

class GoalManager extends Component {
  static propTypes = {
    heaven: PropTypes.object,
    script: PropTypes.object,
    selectedGoalId: PropTypes.number,
    manifestationActions: PropTypes.array,
    isValidating: PropTypes.bool,
    allMessages: PropTypes.array,
    cast: PropTypes.array,
    scenes: PropTypes.array,
    selectedSceneId: PropTypes.number,
    manifestationHistory: PropTypes.array,
    onGoalSelect: PropTypes.func,
    onManifest: PropTypes.func,
    onSaveScriptToJson: PropTypes.func,
    setState: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 0,
      searchQuery: "",
      carouselIndex: 0,
      hoveredLineIndex: null,
    };
  }

  async componentDidMount() {
    const { heaven, selectedGoalId } = this.props;
    if (heaven && selectedGoalId === null) {
      try {
        const lines = heaven.getLines() || {};
        const lineKeys = Object.keys(lines).map(Number);
        if (lineKeys.length > 0) {
          const firstGoalId = Math.min(...lineKeys);
          await heaven.setCurrentGoalInProgress(firstGoalId);
          this.props.onGoalSelect(firstGoalId);
        }
      } catch (error) {
        console.error("GoalManager: Error auto-selecting goal:", error);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { manifestationHistory, selectedGoalId } = this.props;
    const { searchQuery, carouselIndex } = this.state;
    const filteredGoals = this.getFilteredGoals();

    if (
      prevProps.manifestationHistory !== manifestationHistory ||
      prevState.searchQuery !== searchQuery
    ) {
      if (carouselIndex >= filteredGoals.length && filteredGoals.length > 0) {
        this.setState({ carouselIndex: 0 });
      }
    }
  }

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue });
  };

  handleGoalInProgress = async (goalId) => {
    const { heaven } = this.props;
    if (!heaven.getLines()[goalId]) return;
    this.props.onGoalSelect(goalId);
    try {
      await heaven.setCurrentGoalInProgress(goalId);
    } catch (error) {
      console.error("Error saving currentGoalInProgress:", error);
    }
  };

  handleSearchChange = (event) => {
    this.setState({ searchQuery: event.target.value, carouselIndex: 0 });
  };

  handleCarouselNext = () => {
    const filteredGoals = this.getFilteredGoals();
    if (filteredGoals.length === 0) return;
    this.setState((prevState) => {
      const newIndex = (prevState.carouselIndex + 1) % filteredGoals.length;
      return { carouselIndex: newIndex };
    });
  };

  handleCarouselPrev = () => {
    const filteredGoals = this.getFilteredGoals();
    if (filteredGoals.length === 0) return;
    this.setState((prevState) => {
      const newIndex =
        (prevState.carouselIndex - 1 + filteredGoals.length) % filteredGoals.length;
      return { carouselIndex: newIndex };
    });
  };

  getFilteredGoals = () => {
    const { manifestationHistory, heaven } = this.props;
    const { searchQuery } = this.state;
    const lines = heaven?.getLines() || {};
    if (!manifestationHistory) return [];
    if (!searchQuery) return manifestationHistory;
    return manifestationHistory.filter((entry) => {
      const goal = lines[entry.goalId];
      return goal?.text.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  getMessageRangeForGoal(goalId, entryIndex) {
    const { allMessages, manifestationHistory } = this.props;
    if (!allMessages || allMessages.length === 0 || !manifestationHistory || manifestationHistory.length === 0) {
      console.warn('No messages or manifestationHistory available');
      return { start: 0, end: 0 };
    }

    const sortedHistory = [...manifestationHistory];
    const isSorted = sortedHistory.every((entry, i) => 
      i === 0 || entry.timestamp >= sortedHistory[i - 1].timestamp
    );
    if (!isSorted) {
      console.error('manifestationHistory is not sorted by timestamp:', sortedHistory);
      sortedHistory.sort((a, b) => a.timestamp - b.timestamp);
    }

    const currentEntry = sortedHistory[entryIndex];
    if (!currentEntry || currentEntry.goalId !== goalId) {
      console.warn(`Invalid entry at index ${entryIndex} for goal ${goalId}`);
      return { start: 0, end: 0 };
    }

    const currentTimestamp = currentEntry.timestamp;

    if (entryIndex === 0) {
      const goalMessages = allMessages.filter((msg) => msg.timestamp < currentTimestamp);
      if (goalMessages.length === 0) {
        console.warn(`No messages found before timestamp ${currentTimestamp} for goal ${goalId}`);
        return { start: 0, end: 0 };
      }
      const start = allMessages.indexOf(goalMessages[0]) + 1;
      const end = allMessages.indexOf(goalMessages[goalMessages.length - 1]) + 1;
      return { start, end };
    }

    const prevEntry = sortedHistory[entryIndex - 1];
    const prevTimestamp = prevEntry.timestamp;
    const goalMessages = allMessages.filter(
      (msg) => msg.timestamp > prevTimestamp && msg.timestamp < currentTimestamp
    );
    if (goalMessages.length === 0) {
      console.warn(`No messages found between ${prevTimestamp} and ${currentTimestamp} for goal ${goalId}`);
      return { start: 0, end: 0 };
    }
    const start = allMessages.indexOf(goalMessages[0]) + 1;
    const end = allMessages.indexOf(goalMessages[goalMessages.length - 1]) + 1;
    return { start, end };
  }

  getEmotionColor(emotion) {
    const colorMap = {
      curiosity: "blue",
      concern: "gray",
      rebellion: "red",
      cleansing: "purple",
    };
    return colorMap[emotion?.toLowerCase()] || "white";
  };

  handleLineClick = async (index) => {
    this.props.onGoalSelect(index);
    try {
      await this.props.heaven.setCurrentGoalInProgress(index);
    } catch (error) {
      console.error("Error saving currentGoalInProgress:", error);
    }
  };

  renderGoalCheckmarks = (goalId) => {
    const { manifestationHistory } = this.props;
    const manifestations = manifestationHistory.filter((entry) => entry.goalId === goalId);
    return manifestations.map((_, index) => (
      <span key={`checkmark-${goalId}-${index}`} className="GoalManager--checkmark">✅</span>
    ));
  };

  render() {
    const {
      heaven,
      script,
      selectedGoalId,
      manifestationActions,
      isValidating,
      allMessages,
      cast,
      scenes,
      selectedSceneId,
      manifestationHistory,
      onManifest,
      onSaveScriptToJson,
    } = this.props;

    const { activeTab, searchQuery, carouselIndex, hoveredLineIndex } = this.state;

    const lines = heaven?.getLines() || {};
    const lineKeys = Object.keys(lines).map(Number);
    const filteredGoals = this.getFilteredGoals();

    return (
      <div className="GoalManager">
        <Tabs
          value={activeTab}
          onChange={this.handleTabChange}
          aria-label="Goal Manager Tabs"
        >
          <Tab label="Goals" />
          <Tab label="Goal Details" />
          <Tab label="Canvas" />
        </Tabs>

        {activeTab === 0 && (
          <div className="GoalManager--goals-tab">
            <h3>Available Goals</h3>
            <div className="GoalManager--goal-list">
              {lineKeys.map((key) => (
                <div key={key} className="GoalManager--goal-item">
                  <Checkbox
                    checked={selectedGoalId === key}
                    onChange={() => this.handleGoalInProgress(key)}
                    color="primary"
                    disabled={selectedGoalId === key}
                  />
                  <span onClick={() => this.handleGoalInProgress(key)}>
                    {lines[key].text}{" "}
                    {this.renderGoalCheckmarks(key)}
                  </span>
                  {selectedGoalId === key && (
                    <div className="GoalManager--goal-controls">
                      <div className="GoalManager--manifest-actions">
                        <h4>Manifestation Actions</h4>
                        {manifestationActions.length > 0 ? (
                          <ul>
                            {manifestationActions.map((action, i) => (
                              <li key={i}>
                                {action.character} says: "{action.content}"
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No actions yet.</p>
                        )}
                      </div>
                      <ManifestButton
                        onManifest={onManifest}
                        isValidating={isValidating}
                        disabled={selectedGoalId === null}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="GoalManager--details-tab">
            <h3>Past Achieved Goals</h3>
            <div className="GoalManager--search-bar">
              <input
                type="text"
                placeholder="Search completed goals..."
                value={searchQuery}
                onChange={this.handleSearchChange}
              />
            </div>
            {filteredGoals.length > 0 ? (
              <div className="GoalManager--carousel">
                <button
                  className="GoalManager--carousel-button prev"
                  onClick={this.handleCarouselPrev}
                  disabled={filteredGoals.length <= 1}
                >
                  ←
                </button>
                <div className="GoalManager--carousel-container">
                  <div
                    className="GoalManager--carousel-slide"
                    style={{
                      transform: `translateX(-${carouselIndex * 100}%)`,
                      '--goal-count': filteredGoals.length,
                    }}
                  >
                    {filteredGoals.map((entry, index) => {
                      const goal = lines[entry.goalId];
                      const entryIndex = [...manifestationHistory]
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .findIndex(
                          (e) => e.goalId === entry.goalId && e.timestamp === entry.timestamp
                        );
                      const { start, end } = this.getMessageRangeForGoal(entry.goalId, entryIndex);
                      return (
                        <div
                          key={index}
                          className="GoalManager--past-goal"
                        >
                          <p>
                            <strong>Goal:</strong> {goal?.text || "Unknown"}
                          </p>
                          <p>
                            <strong>Achieved:</strong>{" "}
                            {new Date(entry.timestamp * 1000).toLocaleString()}
                          </p>
                          <p>
                            <strong>Emotions:</strong> {goal?.primaryEmotion || "N/A"}
                            {goal?.secondaryEmotion ? `, ${goal.secondaryEmotion}` : ""}
                          </p>
                          <p>
                            <strong>Coordinates:</strong>{" "}
                            {goal?.coordinates
                              ? `(${goal.coordinates.x}, ${goal.coordinates.y}, ${goal.coordinates.z})`
                              : "N/A"}
                          </p>
                          <p>
                            <strong>End Coordinates:</strong>{" "}
                            {goal?.endX !== undefined
                              ? `(${goal.endX}, ${goal.endY}, ${goal.endZ})`
                              : "N/A"}
                          </p>
                          <p>
                            <strong>Objects:</strong>{" "}
                            {goal?.objectStates?.join(", ") || "None"}
                          </p>
                          <p>
                            <strong>Messages:</strong>{" "}
                            {start > 0 && end >= start
                              ? `Messages ${start}-${end} validate goal`
                              : "No messages available"}
                          </p>
                          <p>
                            <strong>Actions:</strong>
                          </p>
                          <ul>
                            {entry.actions && entry.actions.length > 0 ? (
                              entry.actions.map((action, i) => (
                                <li key={i}>
                                  {action.character} says: "{action.content}"
                                </li>
                              ))
                            ) : (
                              <li>No actions recorded</li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <button
                  className="GoalManager--carousel-button next"
                  onClick={this.handleCarouselNext}
                  disabled={filteredGoals.length <= 1}
                >
                  →
                </button>
              </div>
            ) : (
              <p>No matching completed goals.</p>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="GoalManager--canvas-tab">
            <h3>Goal Visualization</h3>
            <Canvas
              camera={{ position: [150, 150, 150], fov: 60 }}
              style={{ height: "500px", background: "#000" }}
            >
              <ambientLight />
              <pointLight position={[100, 100, 100]} />
              <OrbitControls />
              {lineKeys.map((index) => {
                const line = lines[index];
                const start = [
                  parseFloat(line.coordinates?.x) || 0,
                  parseFloat(line.coordinates?.y) || 0,
                  parseFloat(line.coordinates?.z) || 0,
                ];
                const end = [
                  parseFloat(line.endX) || 0,
                  parseFloat(line.endY) || 0,
                  parseFloat(line.endZ) || 0,
                ];
                const nodeColor =
                  selectedGoalId === index
                    ? "yellow"
                    : this.props.manifestationHistory.some(entry => entry.goalId === index)
                    ? "green"
                    : this.getEmotionColor(line.primaryEmotion);
                const textColor = selectedGoalId === index ? "green" : "gray";

                const midPoint = [
                  (start[0] + end[0]) / 2,
                  (start[1] + end[1]) / 2,
                  (start[2] + end[2]) / 2,
                ];

                const direction = new THREE.Vector3()
                  .subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start))
                  .normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                  new THREE.Vector3(1, 0, 0),
                  direction
                );

                return (
                  <React.Fragment key={`fragment-${index}`}>
                    <mesh
                      key={`node-${index}`}
                      position={end}
                      onClick={() => this.handleLineClick(index)}
                    >
                      <sphereGeometry args={[1.5, 16, 16]} />
                      <meshStandardMaterial color={nodeColor} />
                    </mesh>
                    <Text
                      key={`text-${index}`}
                      position={midPoint}
                      quaternion={quaternion}
                      fontSize={2}
                      color={textColor}
                      anchorX="center"
                      anchorY="middle"
                      onClick={() => this.handleLineClick(index)}
                      onPointerOver={() =>
                        this.setState({ hoveredLineIndex: index })
                      }
                      onPointerOut={() =>
                        this.setState({ hoveredLineIndex: null })
                      }
                    >
                      {line.text}
                    </Text>
                    {hoveredLineIndex === index && (
                      <Html position={end}>
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.75)",
                            color: "#fff",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            fontSize: "12px",
                            maxWidth: "200px",
                            whiteSpace: "normal",
                          }}
                        >
                          {line.text}
                        </div>
                      </Html>
                    )}
                  </React.Fragment>
                );
              })}
            </Canvas>
          </div>
        )}

        <div className="GoalManager--actions">
          {script && (
            <Button
              variant="contained"
              color="primary"
              onClick={onSaveScriptToJson}
              style={{ marginTop: "10px" }}
            >
              Save Script
            </Button>
          )}
        </div>
      </div>
    );
  }
}

export default GoalManager;