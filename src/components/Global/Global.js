import React, { Component } from "react";
import Firebase from "../../firebase/firebase.js";
import Heaven from "../Heaven/Heaven.js";
import "./Global.css";

function getFallbackHeavenData() {
  try {
    return require('./heavenFromAI.json');
  } catch (err) {
    console.error('Failed to load fallback heaven data:', err);
    return null;
  }
}

class Global extends Component {
  constructor(props) {
    super(props);
    this.state = {
      heaven: null,
      timeTravelCode: null,
      heavenId: null,
      loadingProgress: 0,
      error: null,
    };
    this.canvasRef = React.createRef();
  }

  async componentDidMount() {
    const heavenId = this.props.match.params.id || null;
    this.setState({ heavenId, loadingProgress: 10 });

    let heaven;
    try {
      heaven = await Heaven.create(heavenId, getFallbackHeavenData());
      this.setState({ loadingProgress: 30, heaven, loadingProgress: 50 });
    } catch (error) {
      console.error(`Error initializing Global Heaven for ID: ${heavenId || 'fallback'}:`, error);
      this.setState({ error: "Failed to initialize Heaven.", loadingProgress: 100 });
      return;
    }

    let timeTravelCode = heaven.getTimeTravelFile();
    this.setState({ loadingProgress: 60 });

    if (!timeTravelCode || typeof timeTravelCode !== 'string') {
      console.warn('No valid timetravelfile in Global heaven data');
      this.setState({ error: 'No timetravelfile exists.', loadingProgress: 100 });
      return;
    }

    this.setState({ timeTravelCode, loadingProgress: 100 }, this.drawTimeline);
  }

  drawTimeline = () => {
    const { timeTravelCode } = this.state;
    const canvas = this.canvasRef.current;
    if (!canvas || !timeTravelCode) return;

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 400;

    // Parse actions from timetravel.js
    const actions = [];
    const regex = /ThrydObjects\.actionHandlers\.(\w+)\s*=\s*\(\)\s*=>\s*\(\{\s*action:\s*'([^']+)',\s*status:\s*'success'\s*\}\);/g;
    let match;
    while ((match = regex.exec(timeTravelCode)) !== null) {
      actions.push({ name: match[1], full: match[2], isGoalManifest: match[1] === 'goalmanifest' });
    }

    // Draw timeline
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.moveTo(50, canvas.height / 2);
    ctx.lineTo(canvas.width - 50, canvas.height / 2);
    ctx.strokeStyle = '#000';
    ctx.stroke();

    // Plot actions
    const step = (canvas.width - 100) / (actions.length || 1);
    actions.forEach((action, index) => {
      const x = 50 + index * step;
      const y = canvas.height / 2;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = action.isGoalManifest ? '#FFD700' : action.name.includes('goalmanifest') ? '#FF4500' : action.name.includes('tunde') ? '#0000FF' : '#FF0000';
      ctx.fill();

      // Label
      ctx.font = '12px Arial';
      ctx.fillStyle = '#000';
      ctx.fillText(action.name, x - 20, y - 10);
    });
  };

  render() {
    const { loadingProgress, error } = this.state;

    if (loadingProgress < 100) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-semibold mb-4">Loading Narrative Timeline...</h2>
          <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-500 transition-all duration-300"
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
      <div className="Global p-4">
        <h2 className="text-2xl font-semibold mb-4">Narrative Timeline</h2>
        <canvas ref={this.canvasRef} className="border rounded"></canvas>
      </div>
    );
  }
}

export default Global;