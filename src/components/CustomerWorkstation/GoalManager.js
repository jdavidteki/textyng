import React from "react";
import PropTypes from "prop-types";
import { Button, Tabs, Tab, Checkbox } from "@material-ui/core";
import { TextField } from "@mui/material";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, Html, Line } from "@react-three/drei";
import * as THREE from "three";
import ManifestButton from "./ManifestButton.js";

import "./GoalManager.css";

class GoalManager extends React.Component {
  static propTypes = {
    heaven: PropTypes.object,
    script: PropTypes.object,
    selectedGoalId: PropTypes.number,
    manifestationActions: PropTypes.arrayOf(PropTypes.object),
    isValidating: PropTypes.bool,
    allMessages: PropTypes.arrayOf(PropTypes.object),
    cast: PropTypes.arrayOf(PropTypes.object),
    scenes: PropTypes.arrayOf(PropTypes.object),
    selectedSceneId: PropTypes.string,
    manifestationHistory: PropTypes.arrayOf(PropTypes.object),
    activeAction: PropTypes.object,
    onGoalSelect: PropTypes.func.isRequired,
    onManifest: PropTypes.func.isRequired,
    onSaveScriptToJson: PropTypes.func.isRequired,
    setState: PropTypes.func,
  };

  static defaultProps = {
    heaven: null,
    script: null,
    selectedGoalId: null,
    manifestationActions: [],
    isValidating: false,
    allMessages: [],
    cast: [],
    scenes: [],
    selectedSceneId: null,
    manifestationHistory: [],
    activeAction: null,
    setState: () => {},
  };

  constructor(props) {
    super(props);
    this.state = {
      activeTab: 0,
      searchQuery: "",
      carouselIndex: 0,
      hoveredLineIndex: null,
      startX: "",
      startY: "",
      startZ: "",
      endX: "",
      endY: "",
      endZ: "",
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
      } catch (err) {
        console.error("GoalManager: Could not auto-select goal:", err);
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { manifestationHistory, selectedGoalId } = this.props;
    const { searchQuery, carouselIndex } = this.state;
    const filtered = this.getFilteredGoals();

    if (
      prevProps.manifestationHistory !== manifestationHistory ||
      prevState.searchQuery !== searchQuery
    ) {
      if (carouselIndex >= filtered.length && filtered.length > 0) {
        this.setState({ carouselIndex: 0 });
      }
    }

    if (prevProps.selectedGoalId !== selectedGoalId && selectedGoalId !== null) {
      const lines = this.props.heaven?.getLines() || {};
      const goalLine = lines[selectedGoalId];
      if (goalLine) {
        this.setState({
          startX: goalLine.coordinates?.x?.toString() || "",
          startY: goalLine.coordinates?.y?.toString() || "",
          startZ: goalLine.coordinates?.z?.toString() || "",
          endX: goalLine.endX?.toString() || "",
          endY: goalLine.endY?.toString() || "",
          endZ: goalLine.endZ?.toString() || "",
        });
      }
    }
  }

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue });
  };

  handleGoalSelect = async (goalId) => {
    const { heaven } = this.props;
    const lines = heaven?.getLines() || {};
    if (!lines[goalId]) {
      console.warn(`Goal ID ${goalId} not found in lines`);
      return;
    }
    this.props.onGoalSelect(goalId);
    try {
      await heaven.setCurrentGoalInProgress(goalId);
    } catch (err) {
      console.error(`Failed to save goal ${goalId}:`, err);
    }
  };

  handleSearchChange = (event) => {
    this.setState({ searchQuery: event.target.value, carouselIndex: 0 });
  };

  handleCoordinateChange = (field) => (event) => {
    this.setState({ [field]: event.target.value });
  };

  handleManifest = () => {
    const { startX, startY, startZ, endX, endY, endZ } = this.state;
    const coords = {};
    if (startX && startY && startZ && endX && endY && endZ) {
      coords.startX = parseFloat(startX);
      coords.startY = parseFloat(startY);
      coords.startZ = parseFloat(startZ);
      coords.endX = parseFloat(endX);
      coords.endY = parseFloat(endY);
      coords.endZ = parseFloat(endZ);
    }
    this.props.onManifest(coords);
  };

  handleCarouselNext = () => {
    const filtered = this.getFilteredGoals();
    if (filtered.length === 0) return;
    this.setState((prevState) => ({
      carouselIndex: (prevState.carouselIndex + 1) % filtered.length,
    }));
  };

  handleCarouselPrev = () => {
    const filtered = this.getFilteredGoals();
    if (!filtered.length) return;
    this.setState((prevState) => ({
      carouselIndex: (prevState.carouselIndex - 1 + filtered.length) % filtered.length,
    }));
  };

  getFilteredGoals = () => {
    const { manifestationHistory, heaven } = this.props;
    const { searchQuery } = this.state;
    const lines = heaven?.getLines() || {};
    if (!manifestationHistory || !Array.isArray(manifestationHistory)) return [];
    if (!searchQuery) return manifestationHistory;
    return manifestationHistory.filter((entry) => {
      const goal = lines[entry.goalId] || { text: "Unknown Goal" };
      return goal.text.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  getMessagesForGoal(goalId, entryIndex) {
    const { allMessages, manifestationHistory } = this.props;
    if (!allMessages?.length || !manifestationHistory?.length) {
      console.warn("No messages or history available");
      return { start: 0, end: null };
    }

    const sorted = [...manifestationHistory].sort((a, b) => a.timestamp - b.timestamp);
    const current = sorted[entryIndex];
    if (!current || current.goalId !== goalId) {
      console.warn(`Invalid entry at index ${entryIndex} for goal ${goalId}`);
      return { start: 0, end: null };
    }

    const currentTime = current.timestamp;

    if (entryIndex === 0) {
      const goalMessages = allMessages.filter((msg) => msg.timestamp < currentTime);
      if (!goalMessages.length) {
        console.warn(`No messages found before ${currentTime} for goal ${goalId}`);
        return { start: 0, end: null };
      }
      const start = allMessages.indexOf(goalMessages[0]);
      const end = allMessages.indexOf(goalMessages[goalMessages.length - 1]);
      return { start, end };
    }

    const prev = sorted[entryIndex - 1];
    const prevTime = prev.timestamp;
    const goalMessages = allMessages.filter(
      (msg) => msg.timestamp > prevTime && msg.timestamp < currentTime
    );
    if (!goalMessages.length) {
      console.warn(`No messages between ${prevTime} and ${currentTime} for goal ${goalId}`);
      return { start: null, end: null };
    }
    const start = allMessages.indexOf(goalMessages[0]);
    const end = allMessages.indexOf(goalMessages[goalMessages.length - 1]);
    return { start, end };
  }

  getEmotionColor(emotion) {
    const colors = {
      curiosity: "blue",
      concern: "gray",
      rebellion: "red",
      cleansing: "purple",
      hope: "cyan",
      nostalgia: "orange",
      wonder: "yellow",
      melancholy: "pink",
      reverence: "violet",
    };
    return colors[emotion?.toLowerCase()] || "white";
  }

  handleLineClick = async (index) => {
    this.props.onGoalSelect(index);
    try {
      await this.props.heaven?.setCurrentGoalInProgress(index);
    } catch (err) {
      console.error(`Failed to set current goal ${index}:`, err);
    }
  };

  renderGoalMarks = (goalId) => {
    const { manifestationHistory } = this.props;
    const marks = manifestationHistory?.filter((entry) => entry.goalId === goalId) || [];
    return marks.map((_, index) => (
      <span key={`mark-${goalId}-${index}`} className="GoalManager-mark">
        ✔
      </span>
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
      onSaveScriptToJson,
    } = this.props;

    const { activeTab, searchQuery, carouselIndex, hoveredLineIndex, startX, startY, startZ, endX, endY, endZ } =
      this.state;

    const lines = heaven?.getLines() || {};
    const lineKeys = Object.keys(lines).map(Number);

    return (
      <div className="GoalManager">
        <Tabs value={activeTab} onChange={this.handleTabChange} aria-label="Goal Manager Tabs">
          <Tab label="Goals" />
          <Tab label="Details" />
          <Tab label="Canvas" />
        </Tabs>

        {activeTab === 0 && (
          <div className="GoalManager--goals">
            <h3>Available Goals</h3>
            <div className="GoalManager--goal-list">
              {lineKeys.map((key) => (
                <div key={key} className="GoalManager--goal-item">
                  <Checkbox
                    checked={selectedGoalId === key}
                    onChange={() => this.handleGoalSelect(key)}
                    color="primary"
                    disabled={selectedGoalId === key}
                  />
                  <span onClick={() => this.handleGoalSelect(key)}>
                    {key}: {lines[key].text}
                    {this.renderGoalMarks(key)}
                  </span>
                  {selectedGoalId === key && (
                    <div className="GoalManager--controls">
                      <div className="GoalManager--inputs">
                        <h4>Define Coordinates (Optional)</h4>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          <TextField
                            label="Start X"
                            value={startX}
                            onChange={this.handleCoordinateChange("startX")}
                            type="number"
                            size="small"
                          />
                          <TextField
                            label="Start Y"
                            value={startY}
                            onChange={this.handleCoordinateChange("startY")}
                            type="number"
                            size="small"
                          />
                          <TextField
                            label="Start Z"
                            value={startZ}
                            onChange={this.handleCoordinateChange("startZ")}
                            type="number"
                            size="small"
                          />
                          <TextField
                            label="End X"
                            value={endX}
                            onChange={this.handleCoordinateChange("endX")}
                            type="number"
                            size="small"
                          />
                          <TextField
                            label="End Y"
                            value={endY}
                            onChange={this.handleCoordinateChange("endY")}
                            type="number"
                            size="small"
                          />
                          <TextField
                            label="End Z"
                            value={endZ}
                            onChange={this.handleCoordinateChange("endZ")}
                            type="number"
                            size="small"
                          />
                        </div>
                      </div>
                      <div className="GoalManager--actions">
                        <h4>Actions</h4>
                        {manifestationActions.length ? (
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
                        onManifest={this.handleManifest}
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
          <div className="GoalManager--details">
            <h3>Past Goals</h3>
            <div className="GoalManager--search">
              <input
                type="text"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={this.handleSearchChange}
              />
            </div>
            {this.getFilteredGoals().length > 0 ? (
              <div className="GoalManager--carousel">
                <Button
                  className="GoalManager--carousel-btn prev"
                  onClick={this.handleCarouselPrev}
                  disabled={this.getFilteredGoals().length <= 1}
                >
                  ←
                </Button>
                <div className="GoalManager--carousel-container">
                  <div
                    className="GoalManager--carousel-slide"
                    style={{
                      transform: `translateX(-${carouselIndex * 100}%)`,
                      "--goal-count": this.getFilteredGoals().length,
                    }}
                  >
                    {this.getFilteredGoals().map((entry, index) => {
                      const goal = lines[entry.goalId] || { text: "Unknown Goal" };
                      const entryIndex = [...manifestationHistory]
                        .sort((a, b) => a.timestamp - b.timestamp)
                        .findIndex((e) => e.goalId === entry.goalId && e.timestamp === entry.timestamp);
                      const { start, end } = this.getMessagesForGoal(entry.goalId, entryIndex);
                      return (
                        <div key={index} className="GoalManager--past-goal">
                          <p>
                            <strong>Goal:</strong> {goal.text}
                          </p>
                          <p>
                            <strong>Date:</strong> {new Date(entry.timestamp * 1000).toLocaleString()}
                          </p>
                          <p>
                            <strong>Emotions:</strong> {goal.emotion || "N/A"}
                            {goal.secondaryEmotion ? `, ${goal.secondaryEmotion}` : ""}
                          </p>
                          <p>
                            <strong>Start:</strong>{" "}
                            {entry.startX !== undefined
                              ? `(${entry.startX}, ${entry.startY}, ${entry.startZ})`
                              : "N/A"}
                          </p>
                          <p>
                            <strong>End:</strong>{" "}
                            {entry.endX !== undefined
                              ? `(${entry.endX}, ${entry.endY}, ${entry.endZ})`
                              : "N/A"}
                          </p>
                          <p>
                            <strong>Probability:</strong> {(entry.probability * 100).toFixed(2)}%
                          </p>
                          <p>
                            <strong>Total Length:</strong> {entry.length ? entry.length.toFixed(2) : "N/A"}
                          </p>
                          <p>
                            <strong>Objects:</strong> {goal.objects?.join(", ") || "None"}
                          </p>
                          <p>
                            <strong>Messages:</strong>{" "}
                            {start !== null && end >= start ? `Messages ${start}-${end}` : "No messages"}
                          </p>
                          <p>
                            <strong>Actions:</strong>
                          </p>
                          <ul>
                            {entry.actions?.length > 0 ? (
                              entry.actions.map((action, i) => (
                                <li key={i}>
                                  {action.character} says: "{action.content}"
                                </li>
                              ))
                            ) : (
                              <li>No actions</li>
                            )}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <Button
                  className="GoalManager--carousel-btn next"
                  onClick={this.handleCarouselNext}
                  disabled={this.getFilteredGoals().length <= 1}
                >
                  →
                </Button>
              </div>
            ) : (
              <p>No matching goals.</p>
            )}
          </div>
        )}

        {activeTab === 2 && (
          <div className="GoalManager--canvas">
            <h3>Visualization</h3>
            <Canvas camera={{ position: [150, 150, 150], fov: 60 }} style={{ height: "500px", background: "#000" }}>
              <ambientLight />
              <pointLight position={[100, 100, 100]} />
              <OrbitControls />
              {lineKeys.map((key) => {
                const line = lines[key];
                const start = [
                  parseFloat(line.coordinates?.x) || 0,
                  parseFloat(line.coordinates?.y) || 0,
                  parseFloat(line.coordinates?.z) || 0,
                ];
                const end = [parseFloat(line.endX) || 0, parseFloat(line.endY) || 0, parseFloat(line.endZ) || 0];
                const nodeColor =
                  selectedGoalId === key
                    ? "yellow"
                    : manifestationHistory.some((entry) => entry.goalId === key)
                    ? "green"
                    : this.getEmotionColor(line.emotion);
                const textColor = selectedGoalId === key ? "green" : "gray";
                const midPoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2, (start[2] + end[2]) / 2];
                const direction = new THREE.Vector3()
                  .subVectors(new THREE.Vector3(...end), new THREE.Vector3(...start))
                  .normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(
                  new THREE.Vector3(1, 0, 0),
                  direction
                );

                return (
                  <React.Fragment key={`fragment-${key}`}>
                    <Line points={[start, end]} color={nodeColor} lineWidth={2} />
                    <mesh key={`node-${key}`} position={end} onClick={() => this.handleLineClick(key)}>
                      <sphereGeometry args={[1.5, 16, 16]} />
                      <meshStandardMaterial color={nodeColor} />
                    </mesh>
                    <Text
                      key={`text-${key}`}
                      position={midPoint}
                      quaternion={quaternion}
                      fontSize={2}
                      color={textColor}
                      anchorX="center"
                      anchorY="middle"
                      onClick={() => this.handleLineClick(key)}
                      onPointerOver={() => this.setState({ hoveredLineIndex: key })}
                      onPointerOut={() => this.setState({ hoveredLineIndex: null })}
                    >
                      {line.text}
                    </Text>
                    {hoveredLineIndex === key && (
                      <Html position={end}>
                        <div className="tooltip">{line.text}</div>
                      </Html>
                    )}
                  </React.Fragment>
                );
              })}
              {manifestationHistory.map((entry, index) => {
                if (!entry.path?.length) return null;
                return entry.path.map((subPath, i) => {
                  const color = subPath.probability >= 0.7 ? "green" : subPath.probability >= 0.3 ? "blue" : "red";
                  return (
                    <React.Fragment key={`line-${index}-${i}`}>
                      <Line
                        points={[
                          [subPath.start.x, subPath.start.y, subPath.start.z],
                          [subPath.end.x, subPath.end.y, subPath.end.z],
                        ]}
                        color={color}
                        lineWidth={3}
                        dashed={true}
                        opacity={0.8 - index * 0.1}
                      />
                      <Html
                        position={[
                          (subPath.start.x + subPath.end.x) / 2,
                          subPath.start.y,
                          (subPath.start.z + subPath.end.z) / 2,
                        ]}
                      >
                        <div
                          style={{
                            background: "rgba(0, 0, 0, 0.75)",
                            color: "#fff",
                            padding: "5px 10px",
                            borderRadius: "4px",
                            fontSize: "10px",
                          }}
                        >
                          Line {i + 1}: {(subPath.probability * 100).toFixed(2)}%
                          <br />
                          Length: {subPath.length ? subPath.length.toFixed(2) : "N/A"}
                        </div>
                      </Html>
                    </React.Fragment>
                  );
                });
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