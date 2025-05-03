import React, { Component } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import * as THREE from 'three';

function getHeavenData(props) {
  try {
    if (props?.location?.state?.updatedData) {
      return props.location.state.updatedData;
    }
    const saved = require('./heavenFromAI.json');
    return saved;
  } catch (err) {
    console.error('Failed to load heaven data:', err);
    return null;
  }
}

class ArtistWorkstation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedLines: [],
      selectedConnections: new Set(),
      heavenData: getHeavenData(props),
      hoveredLineIndex: null,
      relationshipStrategies: {}, // Maps "fromIndex-toIndex" to { strategy, response, history, error, retryCount }
      newConnectionTargets: {}, // Maps fromIndex to target toIndex for new connection
      showConnectionForm: {}, // Maps fromIndex to boolean for toggling connection form
    };
  }

  componentDidMount() {
    console.log('Artist Workstation loaded');
    // Populate selectedLines and relationshipStrategies from heavenData
    const { heavenData } = this.state;
    if (heavenData?.lines) {
      const selectedLines = new Set();
      const relationshipStrategies = {};

      heavenData.lines.forEach((line, index) => {
        if (line.connections && line.connections.length > 0) {
          selectedLines.add(index);
          line.connections.forEach((conn) => {
            selectedLines.add(conn.to); // Add the target line
            const key = `${conn.from}-${conn.to}`;
            relationshipStrategies[key] = {
              strategy: conn.strategy,
              response: conn.response,
              history: [{ strategy: conn.strategy, response: conn.response }],
              error: null,
              retryCount: 0,
            };
          });
        }
      });

      this.setState({
        selectedLines: Array.from(selectedLines),
        relationshipStrategies,
      });
    }
  }

  handleLineClick = (index) => {
    this.setState((prev) => {
      const alreadySelected = prev.selectedLines.includes(index);
      const newSelectedLines = alreadySelected
        ? prev.selectedLines.filter((i) => i !== index)
        : [...prev.selectedLines, index];
      console.log('handleLineClick: index=', index, 'newSelectedLines=', newSelectedLines);
      return { selectedLines: newSelectedLines };
    });
  };

  handleRemoveLine = (index) => {
    this.setState((prev) => {
      const newSelectedLines = prev.selectedLines.filter((i) => i !== index);
      const newRelationshipStrategies = { ...prev.relationshipStrategies };
      Object.keys(newRelationshipStrategies).forEach((key) => {
        if (key.includes(`${index}-`) || key.includes(`-${index}`)) {
          delete newRelationshipStrategies[key];
        }
      });

      const newNewConnectionTargets = { ...prev.newConnectionTargets };
      delete newNewConnectionTargets[index];

      const newShowConnectionForm = { ...prev.showConnectionForm };
      delete newShowConnectionForm[index];

      // Update heavenData to remove connections involving this line
      const newHeavenData = {
        ...prev.heavenData,
        lines: prev.heavenData.lines.map((line, i) =>
          i === index
            ? { ...line, connections: [] }
            : { ...line, connections: (line.connections || []).filter((conn) => conn.from !== index && conn.to !== index) }
        ),
      };

      // Save to heavenFromAI.json
      this.saveHeavenData(newHeavenData);

      console.log('handleRemoveLine: index=', index, 'newSelectedLines=', newSelectedLines);
      return {
        selectedLines: newSelectedLines,
        relationshipStrategies: newRelationshipStrategies,
        newConnectionTargets: newNewConnectionTargets,
        showConnectionForm: newShowConnectionForm,
        heavenData: newHeavenData,
      };
    });
  };

  handleConnectionClick = (id) => {
    this.setState((prev) => {
      const newSet = new Set(prev.selectedConnections);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedConnections: newSet };
    });
  };

  handleNewConnectionTarget = (fromIndex, toIndex) => {
    this.setState((prev) => ({
      newConnectionTargets: {
        ...prev.newConnectionTargets,
        [fromIndex]: toIndex === '' ? null : parseInt(toIndex),
      },
    }));
  };

  toggleConnectionForm = (fromIndex) => {
    this.setState((prev) => ({
      showConnectionForm: {
        ...prev.showConnectionForm,
        [fromIndex]: !prev.showConnectionForm[fromIndex],
      },
    }));
  };

  handleRelationshipStrategyChange = (fromIndex, toIndex, value) => {
    const key = `${fromIndex}-${toIndex}`;
    this.setState((prev) => ({
      relationshipStrategies: {
        ...prev.relationshipStrategies,
        [key]: {
          ...prev.relationshipStrategies[key],
          strategy: value,
          history: prev.relationshipStrategies[key]?.history || [],
        },
      },
    }));
  };

  submitRelationshipStrategy = async (fromIndex, toIndex) => {
    const { heavenData, relationshipStrategies } = this.state;
    const key = `${fromIndex}-${toIndex}`;
    const strategy = relationshipStrategies[key]?.strategy;
    const history = relationshipStrategies[key]?.history || [];
    const retryCount = relationshipStrategies[key]?.retryCount || 0;

    if (!strategy) {
      alert('Please enter a strategy for the connection.');
      return;
    }

    if (fromIndex === null || toIndex === null || !heavenData.lines[fromIndex] || !heavenData.lines[toIndex]) {
      alert('Please select a valid line to connect to.');
      return;
    }

    const line1 = heavenData.lines[fromIndex];
    const line2 = heavenData.lines[toIndex];

    try {
      this.setState((prev) => ({
        relationshipStrategies: {
          ...prev.relationshipStrategies,
          [key]: {
            ...prev.relationshipStrategies[key],
            error: null,
            retryCount: 0,
          },
        },
      }));

      const openAIAPI = await Firebase.getOpenAIAPI();
      const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join('') : openAIAPI;
      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });

      const payload = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert at evaluating strategies that enable time travel between two narrative lines in a story about a time-traveling device. Given two lines and a strategy describing how time travel occurs from the first line to the second, evaluate the probability that the strategy is plausible and logical within the context of the narrative. Consider the emotions, object states, and context of the lines. If previous strategies were attempted for this pair, they are provided in the history.

            Return a JSON object with a 'response' key set to 'accept' if the probability is greater than 0.7, or 'decline' if less than or equal to 0.7. Do not include any extra commentary.

            Example:
            {
              "response": "accept"
            }`,
          },
          {
            role: 'user',
            content: `Line 1: "${line1.text}"
Emotion: ${line1.primaryEmotion} (${line1.secondaryEmotion})
Objects: ${line1.objectStates}

Line 2: "${line2.text}"
Emotion: ${line2.primaryEmotion} (${line2.secondaryEmotion})
Objects: ${line2.objectStates}

Strategy: "${strategy}"

Previous attempts for this pair (if any):
${history.map((h, i) => `Attempt ${i + 1}: Strategy: "${h.strategy}", Response: ${h.response}`).join('\n')}

Evaluate the probability that this strategy logically enables time travel from Line 1 to Line 2. Return a JSON object with the 'response' key set to 'accept' or 'decline'.`,
          },
        ],
        temperature: 0.2,
      };

      const gptResponse = await openai.chat.completions.create(payload);
      const aiResponse = gptResponse.choices?.[0]?.message?.content;
      const parsed = JSON.parse(aiResponse);

      // Update relationshipStrategies with the response and history
      const newHistory = [...history, { strategy, response: parsed.response }].slice(-1); // Keep only the latest attempt

      // Update heavenData
      let newHeavenData = { ...this.state.heavenData };
      newHeavenData = {
        ...newHeavenData,
        lines: newHeavenData.lines.map((line, i) =>
          i === fromIndex
            ? {
                ...line,
                connections: [
                  ...(line.connections || []).filter((conn) => conn.to !== toIndex), // Remove previous connection to this target
                  { from: fromIndex, to: toIndex, strategy, response: parsed.response },
                ],
              }
            : { ...line, connections: (line.connections || []).filter((conn) => conn.to !== toIndex || conn.from !== fromIndex) }
        ),
      };
      // Save to heavenFromAI.json
      this.saveHeavenData(newHeavenData);

      this.setState((prev) => ({
        relationshipStrategies: {
          ...prev.relationshipStrategies,
          [key]: {
            strategy,
            response: parsed.response,
            history: newHistory,
            error: null,
            retryCount: 0,
          },
        },
        heavenData: newHeavenData,
        newConnectionTargets: {
          ...prev.newConnectionTargets,
          [fromIndex]: null,
        },
        showConnectionForm: {
          ...prev.showConnectionForm,
          [fromIndex]: false,
        },
        selectedLines: Array.from(new Set([...prev.selectedLines, fromIndex, toIndex])), // Ensure both lines are selected
      }));

      if (parsed.response === 'decline') {
        alert('Strategy declined. Please revise and try again.');
      }
    } catch (error) {
      console.error('Error submitting strategy to OpenAI:', error);
      if (retryCount < 3) {
        this.setState((prev) => ({
          relationshipStrategies: {
            ...prev.relationshipStrategies,
            [key]: {
              ...prev.relationshipStrategies[key],
              error: `Error submitting strategy. Retrying (${retryCount + 1}/3)...`,
              retryCount: retryCount + 1,
            },
          },
        }));
        setTimeout(() => this.submitRelationshipStrategy(fromIndex, toIndex), 1000);
      } else {
        this.setState((prev) => ({
          relationshipStrategies: {
            ...prev.relationshipStrategies,
            [key]: {
              ...prev.relationshipStrategies[key],
              error: 'Failed to evaluate strategy after 3 attempts.',
              retryCount: 0,
            },
          },
        }));
      }
    }
  };

  saveHeavenData = (newHeavenData) => {
    try {
      const dataStr = JSON.stringify(newHeavenData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'heavenFromAI.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Prompted download for heavenFromAI.json');
    } catch (err) {
      console.error('Failed to save heaven data:', err);
    }
  };

  getEmotionColor = (emotion) => {
    const emotionColors = {
      hope: 'green',
      receptive: 'cyan',
      nostalgia: 'blue',
      rebellion: 'red',
      wonder: 'purple',
      melancholy: 'gray',
      reverence: 'gold',
    };
    return emotionColors[emotion] || 'skyblue';
  };

  getConnectionColor = (index) => {
    const colors = ['orange', 'purple', 'cyan', 'pink', 'lime', 'teal', 'magenta'];
    return colors[index % colors.length];
  };

  render3DCanvas() {
    const { heavenData, selectedLines, selectedConnections, hoveredLineIndex } = this.state;
    if (!heavenData?.lines) {
      return <div>No data available. Please check your input.</div>;
    }
    const lines = heavenData.lines;

    return (
      <Canvas camera={{ position: [150, 150, 150], fov: 60 }}>
        <ambientLight />
        <pointLight position={[100, 100, 100]} />
        <OrbitControls />

        {lines.map((line, index) => {
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
          const lineId = `line-${index}`;
          const nodeColor = selectedLines.includes(index)
            ? 'yellow'
            : this.getEmotionColor(line.primaryEmotion);
          const textColor = selectedLines.includes(index)
            ? 'green'
            : selectedConnections.has(lineId)
            ? 'green'
            : 'gray';

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
                onPointerOver={() => this.setState({ hoveredLineIndex: index })}
                onPointerOut={() => this.setState({ hoveredLineIndex: null })}
              >
                {line.text}
              </Text>
              {hoveredLineIndex === index && (
                <Html position={end}>
                  <div
                    style={{
                      background: 'rgba(0, 0, 0, 0.75)',
                      color: '#fff',
                      padding: '5px 10px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      maxWidth: '200px',
                      whiteSpace: 'normal',
                    }}
                  >
                    {line.text}
                  </div>
                </Html>
              )}
            </React.Fragment>
          );
        })}

        {/* Render connections for accepted strategies */}
        {Object.entries(this.state.relationshipStrategies).map(([key, data], index) => {
          if (data.response !== 'accept') return null;
          const [fromIndex, toIndex] = key.split('-').map(Number);
          const fromLine = lines[fromIndex];
          const toLine = lines[toIndex];
          const start = [
            parseFloat(fromLine.endX) || 0,
            parseFloat(fromLine.endY) || 0,
            parseFloat(fromLine.endZ) || 0,
          ];
          const end = [
            parseFloat(toLine.coordinates.x) || 0,
            parseFloat(toLine.coordinates.y) || 0,
            parseFloat(toLine.coordinates.z) || 0,
          ];

          const points = [
            new THREE.Vector3(...start),
            new THREE.Vector3(...end),
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);

          return (
            <line key={`connection-${key}`}>
              <bufferGeometry attach="geometry" {...geometry} />
              <lineBasicMaterial attach="material" color={this.getConnectionColor(index)} linewidth={2} />
            </line>
          );
        })}
      </Canvas>
    );
  }

  renderSelectedLinesTab() {
    const { selectedLines, heavenData, relationshipStrategies, newConnectionTargets, showConnectionForm } = this.state;
    if (!heavenData?.lines || selectedLines.length === 0) {
      return (
        <div style={{ padding: '10px', background: '#fff', borderTop: '1px solid #ccc' }}>
          No lines selected.
        </div>
      );
    }

    return (
      <div style={{ padding: '10px', background: '#fff', borderTop: '1px solid #ccc', maxHeight: '200px', overflowY: 'auto' }}>
        <h4>Selected Lines</h4>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {selectedLines.map((index) => {
            const line = heavenData.lines[index];
            const targetIndex = newConnectionTargets[index] ?? '';
            const connections = Object.entries(relationshipStrategies).filter(([key]) =>
              key.startsWith(`${index}-`)
            );

            return (
              <li
                key={`selected-line-${index}`}
                style={{
                  padding: '8px',
                  marginBottom: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{line.text}</strong><br />
                    Emotion: {line.primaryEmotion} ({line.secondaryEmotion})<br />
                    Objects: {line.objectStates}
                  </div>
                  <button
                    onClick={() => this.handleRemoveLine(index)}
                    style={{ background: '#ff4d4d', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                  >
                    Remove
                  </button>
                </div>
                <button
                  onClick={() => this.toggleConnectionForm(index)}
                  style={{ background: '#2196F3', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', marginTop: '10px' }}
                >
                  {showConnectionForm[index] ? 'Hide Connection Form' : 'Add Connection'}
                </button>
                {showConnectionForm[index] && (
                  <div style={{ marginTop: '10px' }}>
                    <select
                      value={targetIndex}
                      onChange={(e) => this.handleNewConnectionTarget(index, e.target.value)}
                      style={{ width: '100%', marginBottom: '5px' }}
                    >
                      <option value="">Select a line to connect to</option>
                      {selectedLines.map((i) => (
                        <option key={`target-${i}`} value={i}>
                          {heavenData.lines[i].text}
                        </option>
                      ))}
                    </select>
                    {targetIndex !== '' && (
                      <div>
                        <textarea
                          value={relationshipStrategies[`${index}-${targetIndex}`]?.strategy || ''}
                          onChange={(e) => this.handleRelationshipStrategyChange(index, targetIndex, e.target.value)}
                          placeholder={`Describe the strategy for time travel to "${heavenData.lines[targetIndex].text}"`}
                          rows={3}
                          style={{ width: '100%', marginBottom: '5px' }}
                        />
                        <button
                          onClick={() => this.submitRelationshipStrategy(index, targetIndex)}
                          style={{ background: '#4CAF50', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px' }}
                        >
                          Validate
                        </button>
                        {relationshipStrategies[`${index}-${targetIndex}`]?.error && (
                          <div style={{ color: 'red', marginTop: '5px' }}>
                            {relationshipStrategies[`${index}-${targetIndex}`].error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {connections.length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <h5>Connections</h5>
                    {connections.map(([key, data]) => {
                      const [, toIndex] = key.split('-').map(Number);
                      return (
                        <div key={`connection-${key}`} style={{ marginBottom: '10px' }}>
                          <strong>To: {heavenData.lines[toIndex].text}</strong>
                          <p>Strategy: {data.strategy}</p>
                          <p>
                            Status: {data.response === 'accept' ? '✅ Accepted' : data.response === 'decline' ? '❌ Declined' : 'Pending'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  render() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <div style={{ flex: 1 }}>{this.render3DCanvas()}</div>
        </div>
        {this.renderSelectedLinesTab()}
      </div>
    );
  }
}

export default ArtistWorkstation;