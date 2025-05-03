import React, { Component, useRef } from 'react';
import JSONViewer from 'react-json-view';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { saveAs } from 'file-saver';
import Firebase from "../../firebase/firebase.js";

function getHeavenData(props) {
  try {
    if (props?.location?.state?.updatedHeaven) {
      return props.location.state.updatedHeaven;
    }
    const saved = require('./savedHeaven.json');
    return saved;
  } catch (err) {
    console.error('Failed to load heaven data:', err);
    return null;
  }
}

function DraggableEndPoint({ index, position, onChange }) {
  const ref = useRef();

  useFrame(() => {
    if (ref.current?.object && ref.current.dragging) {
      const { x, y, z } = ref.current.object.position;
      onChange(index, { x, y, z });
    }
  });

  return null; // Disabled for precision lines
}

class SendHeavenToAI extends Component {
  constructor(props) {
    super(props);
    const initialData = getHeavenData(props);
    this.state = {
      originalData: initialData,
      heavenData: initialData,
      updatedData: null,
      loading: false,
      error: null,
      hoveredLineIndex: null,
    };
  }

  async componentDidMount() {
    if (!this.state.heavenData && this.props.loadHeaven) {
      try {
        const heavenData = await this.props.loadHeaven();
        this.setState({ heavenData, originalData: heavenData });
      } catch (err) {
        this.setState({ error: 'Failed to load Heaven data.' });
      }
    }
  }

  handleJsonEdit = ({ updated_src }) => {
    this.setState({ heavenData: updated_src });
  };

  handleReset = () => {
    this.setState(prevState => ({ heavenData: prevState.originalData }));
  };

  handleSendToAI = async () => {
    const heavenFromAI = require('./heavenFromAI.json');
    this.setState({ updatedData: heavenFromAI, loading: false });
    return;
  };

  handleSaveToFile = () => {
    const { updatedData } = this.state;
    if (!updatedData) return;

    const blob = new Blob([JSON.stringify(updatedData, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, 'savedHeaven.json');
  };

  updateLineEndPosition = (index, { x, y, z }) => {
    this.setState(prev => {
      const updated = [...prev.updatedData.lines];
      updated[index] = {
        ...updated[index],
        endX: x.toFixed(2),
        endY: y.toFixed(2),
        endZ: z.toFixed(2),
      };
      return { updatedData: { ...prev.updatedData, lines: updated } };
    });
  };

  render3DCanvas() {
    const { updatedData, hoveredLineIndex } = this.state;
    if (!updatedData || !updatedData.lines) return null;

    const sortedLines = updatedData.lines
      .map((line, index) => ({ ...line, originalIndex: index }))
      .sort((a, b) => {
        const getPrecisionScore = (line) =>
          (line.isFirstPrecision ? 1 : 0) +
          (line.isSecondPrecision ? 1 : 0) +
          (line.isThirdPrecision ? 1 : 0);
        return getPrecisionScore(b) - getPrecisionScore(a);
      });

    const starPositions = {};
    sortedLines.forEach((line, i) => {
      const x = parseFloat(line.endX) || 0;
      const y = parseFloat(line.endY) || 0;
      const z = parseFloat(line.endZ) || 0;
      starPositions[i] = new THREE.Vector3(x, y, z);
    });

    const connections = [];
    sortedLines.forEach((lineA, i) => {
      const posA = starPositions[i];
      sortedLines.forEach((lineB, j) => {
        if (i >= j) return;
        const posB = starPositions[j];
        if (posA.distanceTo(posB) < 30) {
          connections.push([posA, posB]);
        }
      });
    });

    return (
      <Canvas camera={{ position: [150, 150, 150], fov: 60 }}>
        <ambientLight />
        <pointLight position={[100, 100, 100]} />
        <OrbitControls />

        {sortedLines.map((line, index) => {
          const x = parseFloat(line.endX) || 0;
          const y = parseFloat(line.endY) || 0;
          const z = parseFloat(line.endZ) || 0;
          const isPrecisionX = line.isFirstPrecision;
          const isPrecisionY = line.isSecondPrecision;
          const isPrecisionZ = line.isThirdPrecision;

          let color = 'skyblue';
          if (isPrecisionX) color = 'red';
          else if (isPrecisionY) color = 'green';
          else if (isPrecisionZ) color = 'blue';

          return (
            <mesh key={`star-${index}`} position={[x, y, z]}>
              <sphereGeometry args={[1.5, 16, 16]} />
              <meshStandardMaterial color={color} />
            </mesh>
          );
        })}

        {connections.map(([start, end], i) => {
          const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
          return (
            <line key={`connection-${i}`} geometry={geometry}>
              <lineBasicMaterial color="orange" transparent opacity={0.3} />
            </line>
          );
        })}

        {sortedLines.map((line, index) => {
          const { coordinates, endX, endY, endZ, text } = line;

          const start = coordinates
            ? new THREE.Vector3(coordinates.x, coordinates.y, coordinates.z)
            : new THREE.Vector3(
                parseFloat(line.startX) || 0,
                parseFloat(line.startY) || 0,
                parseFloat(line.startZ) || 0
              );

          const end = new THREE.Vector3(parseFloat(endX), parseFloat(endY), parseFloat(endZ));
          const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

          const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);

          return (
            <group key={`line-${index}`}>
              <line
                geometry={geometry}
                onPointerOver={() => this.setState({ hoveredLineIndex: index })}
                onPointerOut={() => this.setState({ hoveredLineIndex: null })}
              >
                <lineBasicMaterial
                  attach="material"
                  color={
                    line.isFirstPrecision
                      ? 'red'
                      : line.isSecondPrecision
                      ? 'green'
                      : line.isThirdPrecision
                      ? 'blue'
                      : 'white'
                  }
                  linewidth={1}
                  transparent
                  opacity={0.6}
                />
              </line>
              {hoveredLineIndex === index && (
                <Html position={[mid.x, mid.y, mid.z]} center occlude style={{ pointerEvents: 'auto' }}>
                  <div style={{ color: 'black', fontSize: '12px', background: 'white', padding: '4px', borderRadius: '4px' }}>{text || 'Unnamed Line'}</div>
                </Html>
              )}
            </group>
          );
        })}
      </Canvas>
    );
  }

  render() {
    const { heavenData, updatedData, loading, error } = this.state;

    return (
      <div style={{ padding: 20 }}>
        <h2>🧠 Send Heaven to OpenAI</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {heavenData && (
          <div style={{ marginBottom: 20 }}>
            <h3>Current Heaven JSON:</h3>
            <JSONViewer
              src={heavenData}
              name={false}
              collapsed={false}
              enableClipboard={true}
              onEdit={this.handleJsonEdit}
              onAdd={this.handleJsonEdit}
              onDelete={this.handleJsonEdit}
              displayDataTypes={false}
              style={{ fontSize: '14px' }}
            />
            <button onClick={this.handleReset} style={{ marginTop: 10 }}>
              Reset to Original
            </button>
          </div>
        )}

        <button onClick={this.handleSendToAI} disabled={loading} style={{ marginBottom: 20 }}>
          {loading ? 'Sending to OpenAI...' : 'Send to OpenAI'}
        </button>

        {updatedData && (
          <>
            <h3>🚗 Updated 3D Layout</h3>
            <div style={{ height: 500 }}>{this.render3DCanvas()}</div>

            <h4>🔍 AI-Enhanced JSON:</h4>
            <JSONViewer
              src={updatedData}
              name={false}
              collapsed={false}
              enableClipboard={true}
              displayDataTypes={false}
            />
            <button onClick={this.handleSaveToFile} style={{ marginTop: 20 }}>
              Save to savedHeaven.json
            </button>
          </>
        )}
      </div>
    );
  }
}

export default SendHeavenToAI;
