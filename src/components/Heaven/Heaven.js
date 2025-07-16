import firebase from "../../firebase/firebase.js";
import Script from "../Script/Script.js";
import ThrydObjects from "./timetravel.js";
import { staticManifestResponse } from "./responses.js";
import TimeLocationManager from "./TimeLocationManager.js";
import heavenFromAI from "./heavenFromAI.json";

// Initialize OpenAI client
let openai = null;
async function initializeOpenAI() {
  if (!openai) {
    const openAIAPI = await firebase.getOpenAIAPI();
    const openaiApiKey = Array.isArray(openAIAPI) ? openAIAPI.join('') : openAIAPI;
    const OpenAI = require('openai');
    openai = new OpenAI({ apiKey: openaiApiKey, dangerouslyAllowBrowser: true });
  }
  return openai;
}

// Upload GIF blob to Firebase Storage
async function uploadGifToFirebase(heavenId, goalId, timestamp, gifBlob) {
  try {
    const storageRef = firebase.storage().ref();
    const filePath = `/heavens/${heavenId}/visuals/${goalId}-${timestamp}.gif`;
    const fileRef = storageRef.child(filePath);
    await fileRef.put(gifBlob, { contentType: 'image/gif' });
    const downloadUrl = await fileRef.getDownloadURL();
    return downloadUrl;
  } catch (error) {
    console.error("Failed to upload GIF to Firebase:", error);
    throw error;
  }
}

// Generate video or image/GIF from goal and ThrydObjects commands
async function generateVisualFromGoal(goal, historyEntry, scriptMessage = null, lastManifestationTimestamp = null) {
  const character = historyEntry.characterId || "unknown character";
  const action = scriptMessage ? scriptMessage.content : goal.text;
  const heavenId = historyEntry.heavenId || `heaven-${Date.now()}`;
  const goalId = historyEntry.goalId || 0;
  const timestamp = historyEntry.timestamp || Math.floor(Date.now() / 1000);

  // Fetch commands from Firebase
  let commands = [];
  try {
    commands = await ThrydObjects.getHistory(heavenId, 10); // Cap at last 10 commands
    commands = commands.filter((entry) => {
      const entryTimestamp = parseInt(entry.timestamp);
      const goalTimestamp = historyEntry.timestamp;
      return lastManifestationTimestamp
        ? entryTimestamp > lastManifestationTimestamp
        : Math.abs(entryTimestamp - goalTimestamp) <= 60;
    });
  } catch (error) {
    console.error("Failed to fetch commands for visual generation:", error);
  }

  // Join commands into a single string
  const commandString = commands.map(({ command }) => command).join('');

  const prompt = `
            Generate a 10-second video snapshot depicting "${action}" performed by ${character}.
            Style: ${heavenFromAI.isFiction ? 'fantasy, vibrant colors' : 'realistic, natural lighting'}.
            Context: ${goal.text}.
            Use your discretion to interpret the following sequence of code-like commands as actions or state changes to visualize the scene. Commands represent actions like moving to a location (e.g., newlocation), opening a door (e.g., openDoor), or setting a destination (e.g., setTimeMachineDestination):
            ${commandString || "No commands available"}
          `;

  try {
    await initializeOpenAI();
    // Placeholder: OpenAI video generation API (replace with actual endpoint when available)
    const videoResponse = await openai.video.generations.create({
      model: "video-gen-1", // Hypothetical model
      prompt: prompt,
      duration: 10,
      format: "mp4",
      response_format: "url",
    });
    const videoUrl = videoResponse.data.url;
    return { url: videoUrl, type: "video" };
  } catch (videoError) {
    console.error("Video generation failed:", videoError);
    try {
      // Generate multiple images for GIF
      const imagePrompts = commands
        .slice(0, 3) // Limit to 3 frames
        .map(({ command }, index) => `
              Generate a still image depicting "${action}" performed by ${character}.
              Style: ${heavenFromAI.isFiction ? 'fantasy' : 'realistic'}.
              Context: ${goal.text}. Frame ${index + 1} of ${commands.length}.
              Use your discretion to interpret the following code-like command as an action or state change:
              ${command || "No command available"}
              Background: transparent. Quality: high.
              `);

      const imageUrls = await Promise.all(
        imagePrompts.map(async (subPrompt) => {
          const imageResponse = await openai.images.generate({
            model: "dall-e-3",
            prompt: subPrompt,
            n: 1,
            size: "1024x1024",
            response_format: "url",
            quality: "high",
          });
          return imageResponse.data[0].url;
        })
      );

      if (imageUrls.length > 1) {
        // Defer GIF rendering to GoalManager for client-side processing
        return { url: null, type: "gif", images: imageUrls, heavenId, goalId, timestamp };
      } else {
        return { url: imageUrls[0] || null, type: "image", error: imageUrls.length === 0 ? "No images generated" : null };
      }
    } catch (imageError) {
      console.error("Image/GIF generation failed:", imageError);
      return { url: null, type: null, error: imageError.message };
    }
  }
}

class Heaven {
  constructor(heavenId = null, data = {}, saveToFirebase = true) {
    this.saveToFirebase = saveToFirebase;
    this.script = null;
    this.data = null;
    this.thrydObjects = ThrydObjects;
    this.isFiction = heavenFromAI.isFiction || false;
    this.timeLocationManager = new TimeLocationManager(this.isFiction);
    this.data = { id: heavenId || `heaven-${Date.now()}`, ...data };
    this.lastManifestationTimestamp = null;
  }

  safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular]";
          }
          seen.add(value);
        }
        return value;
      },
      2
    );
  }

  async logErrorToFirebase(errorData) {
    console.error("Failed to log error:", err, errorData);
  }

  static async create(heavenId = null, data = {}, saveToFirebase = true) {
    const heaven = new Heaven(heavenId, data, saveToFirebase);

    const milliseconds = parseInt(Date.now() / 1000, 10);
    const defaultData = {
      id: heavenId || `heaven-${milliseconds}`,
      title: data.title || "Untitled Heaven",
      dateCreated: data.dateCreated || milliseconds,
      scriptId: data.scriptId || null,
      tweets: heaven.validateTweets(data.tweets || []),
      lines: heaven.validateLines(data.lines || []),
      stateSnapshots: data.stateSnapshots || [],
      manifestationHistory: Array.isArray(data.manifestationHistory) ? data.manifestationHistory : [],
      currentGoalInProgress: data.currentGoalInProgress || null,
      timetravelfile: data.timetravelfile || null,
    };

    if (heavenId) {
      try {
        await heaven.grabHeavenFromFirebase(heavenId);
      } catch (error) {
        console.warn(`Failed to fetch heaven ${heavenId} from Firebase, using default data:`, error);
        heaven.data = defaultData;
        heaven.validateData();
      }
    } else {
      heaven.data = defaultData;
      heaven.validateData();
    }

    try {
      await heaven.initializeThrydObjects();
    } catch (error) {
      console.error(`Failed to initialize ThrydObjects for heaven ${heavenId}:`, error);
    }

    if (heaven.data.scriptId) {
      try {
        await heaven.loadScript();
      } catch (error) {
        console.error(`Failed to load script for heaven ${heavenId}:`, error);
      }
    }

    return heaven;
  }

  async initializeThrydObjects() {
    this.thrydObjects = ThrydObjects;
    if (
      this.thrydObjects &&
      typeof this.thrydObjects.initiateThrydObjectsAndExecuteMovement === "function"
    ) {
      await this.thrydObjects.initiateThrydObjectsAndExecuteMovement(this.data.id);
    } else {
      throw new Error("Invalid ThrydObjects or missing initiateThrydObjectsAndExecuteMovement");
    }
  }

  validateTweets(tweets) {
    return tweets
      .map((tweet) => ({
        text: tweet.text || "",
        hashtags: Array.isArray(tweet.hashtags) ? tweet.hashtags : [],
        x: parseFloat(tweet.x) || 0,
        y: parseFloat(tweet.y) || 0,
        z: parseFloat(tweet.z) || 0,
      }))
      .filter((tweet) => tweet.text);
  }

  validateLines(lines) {
    return Object.keys(lines).reduce((acc, key) => {
      const line = lines[key];
      acc[key] = {
        text: line.text || "",
        tweet: line.tweet || "",
        coordinates: {
          x: parseFloat(line.coordinates?.x) || 0,
          y: parseFloat(line.coordinates?.y) || 0,
          z: parseFloat(line.coordinates?.z) || 0,
        },
        endX: parseFloat(line.endX) || 0,
        endY: parseFloat(line.endY) || 0,
        endZ: parseFloat(line.endZ) || 0,
        primaryEmotion: line.primaryEmotion || "",
        secondaryEmotion: line.secondaryEmotion || "",
        objectStates:
          typeof line.objectStates === "string" ? line.objectStates.split(", ").map((s) => s.trim()) : [],
        isFirstPrecision: !!line.isFirstPrecision,
        isSecondPrecision: !!line.isSecondPrecision,
        isThirdPrecision: !!line.isThirdPrecision,
      };
      return acc;
    }, {});
  }

  validateData() {
    if (!this.data.title) {
      console.warn("Heaven title is empty");
      this.data.title = "Untitled Heaven";
    }
    if (!Object.keys(this.data.tweets).length && !Object.keys(this.data.lines).length) {
      console.warn("Heaven has no tweets or lines");
    }
    const tweetTexts = new Set(this.data.tweets.map((t) => t.text));
    Object.values(this.data.lines).forEach((line) => {
      if (line.tweet && !tweetTexts.has(line.tweet)) {
        console.warn(`Line references invalid tweet: ${line.tweet}`);
        line.tweet = "";
      }
    });
    if (!Array.isArray(this.data.manifestationHistory)) {
      console.warn("Invalid manifestationHistory format, resetting to []");
      this.data.manifestationHistory = [];
    }
    if (this.data.currentGoalInProgress !== null && !this.data.lines[this.data.currentGoalInProgress]) {
      console.warn(
        `Invalid currentGoalInProgress ${this.data.currentGoalInProgress}, resetting to null`
      );
      this.data.currentGoalInProgress = null;
    }
  }

  async grabHeavenFromFirebase(heavenId) {
    try {
      const val = await firebase.getHeavenById(heavenId);
      console.debug(`Raw Firebase response for heaven ${heavenId}:`, val);
      if (!val) {
        throw new Error(`Heaven with ID ${heavenId} not found`);
      }

      this.data = {
        id: val.id || heavenId,
        title: val.title || "Untitled Heaven",
        dateCreated: val.dateCreated || parseInt(Date.now() / 1000, 10),
        scriptId: val.scriptId || null,
        tweets: this.validateTweets(val.tweets || []),
        lines: this.validateLines(val.lines || []),
        stateSnapshots: val.stateSnapshots || [],
        manifestationHistory: Array.isArray(val.manifestationHistory) ? val.manifestationHistory : [],
        currentGoalInProgress: val.currentGoalInProgress !== undefined ? val.currentGoalInProgress : null,
        timetravelfile: val.timetravelfile || null,
      };
      this.validateData();
      return this;
    } catch (error) {
      console.error(`grabHeavenFromFirebase: Failed to load heaven ${heavenId}:`, error);
      throw error;
    }
  }

  async loadScript() {
    if (!this.data.scriptId) {
      console.warn("No scriptId provided");
      this.script = null;
      return;
    }
    try {
      const scriptData = await firebase.getScriptById(this.data.scriptId);
      if (!scriptData) {
        throw new Error(`Script with ID ${this.data.scriptId} not found`);
      }
      this.script = new Script(scriptData.name || this.data.title, this.saveToFirebase);
      await this.script.grabScriptFromFirebase(this.data.scriptId);
    } catch (error) {
      console.error(`Failed to load script ${this.data.scriptId}:`, error);
      await this.logErrorToFirebase({
        type: "FirebaseFetchError",
        message: `Failed to load script ${this.data.scriptId}: ${error.message}`,
      });
      this.script = null;
    }
  }

  async sendHeavenToFirebase() {
    if (!this.saveToFirebase) return;
    try {
      await firebase.createNewHeaven(this.data);
      console.debug(`Successfully created heaven ${this.data.id} in Firebase`);
    } catch (error) {
      console.error("Failed to save heaven to Firebase:", error);
      await this.logErrorToFirebase({
        type: "FirebaseSaveError",
        message: `Failed to save heaven ${this.data.id}: ${error.message}`,
      });
      throw error;
    }
  }

  async updateHeavenFirebase() {
    if (!this.saveToFirebase) return;
    try {
      const heavenData = {
        ...this.data,
        script: this.script ? this.script.getAllMessagesAsNodes() : [],
      };
      await firebase.updateHeaven(heavenData);
      console.debug(`Successfully updated heaven ${this.data.id} in Firebase:`, {
        manifestationHistory: heavenData.manifestationHistory,
      });
    } catch (error) {
      console.error(`Failed to update heaven ${this.data.id} in Firebase:`, error);
      await this.logErrorToFirebase({
        type: "FirebaseUpdateError",
        message: `Failed to update heaven ${this.data.id}: ${error.message}`,
      });
      throw error;
    }
  }

  async saveHeavenData(data) {
    try {
      await firebase.saveHeavenData(this.data.id, JSON.stringify(data, null, 2), "heavenData");
      console.debug(`Successfully saved heaven data for ${this.data.id}`);
      return true;
    } catch (err) {
      console.error(`Failed to save heaven data for ${this.data.id}:`, err);
      await this.logErrorToFirebase({
        type: "FirebaseSaveError",
        message: `Failed to save heaven data: ${err.message}`,
      });
      return false;
    }
  }

  parseOpenAIManifestResponse(gptResponse) {
    const aiResponse = gptResponse.choices?.[0]?.message?.content || JSON.stringify(gptResponse);
    if (!aiResponse) {
      console.error("Empty or invalid OpenAI response:", gptResponse);
      throw new Error("No content in OpenAI response");
    }
    const jsonMatch = aiResponse.match(/{[\s\S]*}/);
    const jsonString = jsonMatch ? jsonMatch[0] : aiResponse;
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
      parsed.probability =
        typeof parsed.probability === "string"
          ? parseFloat(parsed.probability.replace(/[<>"]/g, "")) || 0
          : parseFloat(parsed.probability) || 0;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError, "aiResponse:", aiResponse);
      throw new Error("Invalid OpenAI response format");
    }
    if (!parsed.response || !parsed.reasoning || typeof parsed.probability !== "number") {
      console.error("Invalid OpenAI response structure:", parsed);
      throw new Error("Missing required fields in OpenAI response");
    }
    return parsed;
  }

  async validateLineWithOpenAI(goalText, startPos, endPos, actions) {
    return {
      actions: actions.map((action) => ({
        action: action.result?.action || "unknown",
        relevance: action.result?.action.includes("newlocation") ? 0.8 : 0.3,
        direction: action.result?.action.includes("newlocation") ? "positive" : "neutral",
      })),
      coordinates: {
        start: startPos || { x: 0, y: 0, z: 0 },
        end: endPos || { x: 10, y: 10, z: 10 },
      },
      probability: staticManifestResponse.probability || 0.7,
      overallAlignment: actions.some((a) => a.result?.action.includes("newlocation")) ? 0.6 : 0.4,
    };
  }

  async manifest(selectedGoalId, customerCoords = {}, manifestationActions = [], sceneId = "scene-1", characterId = null, timestamp = Date.now()) {
    try {
      const goalLine = this.data.lines[selectedGoalId];
      if (!goalLine) {
        throw new Error(`Goal ID ${selectedGoalId} not found in lines.`);
      }
      if (!characterId || !this.script?.getAllCast().find((c) => c.id === characterId)) {
        throw new Error(`Character ${characterId} not found in cast.`);
      }

      const duration = 60 * 1000;
      const defaultStart = goalLine.coordinates || { x: 0, y: 0, z: 0 };
      const defaultEnd = { x: goalLine.endX || 5, y: goalLine.endY || 5, z: goalLine.endZ || 5 };
      const startPos = customerCoords.startX !== undefined
        ? { x: customerCoords.startX, y: customerCoords.startY, z: customerCoords.startZ }
        : defaultStart;
      const endPos = customerCoords.endX !== undefined
        ? { x: customerCoords.endX, y: customerCoords.endY, z: customerCoords.endZ }
        : defaultEnd;

      try {
        if (this.thrydObjects[characterId]) {
          this.timeLocationManager.validateLogicalConsistency(characterId, startPos, timestamp, duration);
          this.timeLocationManager.setCharacterState(characterId, startPos, timestamp, duration);
        } else {
          this.timeLocationManager.setCharacterState(characterId, startPos, timestamp, duration);
        }
      } catch (error) {
        await this.logErrorToFirebase({
          type: error.name || "LogicalConsistencyError",
          message: error.message,
          goalId: selectedGoalId,
        });
        throw error;
      }

      const lineKeys = Object.keys(this.data.lines).map(Number);
      const nextGoalId = selectedGoalId === 4 ? 5 : lineKeys[lineKeys.indexOf(selectedGoalId) + 1] || null;
      const nextGoal = nextGoalId ? this.data.lines[nextGoalId] : null;

      let targetStart = nextGoal ? nextGoal.coordinates || { x: 10, y: 10, z: 10 } : null;
      let targetEnd = nextGoal ? { x: nextGoal.endX || 20, y: nextGoal.endY || 20, z: nextGoal.endZ || 20 } : null;

      const manifestationHistory = this.data.manifestationHistory;
      if (!nextGoal && manifestationHistory.length > 0) {
        const firstGoal = manifestationHistory.sort((a, b) => a.timestamp - b.timestamp)[0];
        targetStart = {
          x: firstGoal.startX || -10,
          y: firstGoal.startY || -10,
          z: firstGoal.startZ || -10,
        };
      } else if (!nextGoal) {
        targetStart = { x: -10, y: -10, z: -10 };
      }

      // Fetch recent commands from Firebase
      let actions = [];
      try {
        const commands = await ThrydObjects.getHistory(this.data.id, 10);
        actions = commands.map(({ command }) => {
          const parsed = ThrydObjects.parseCommand(command.replace(/;$/, ''));
          return parsed.error ? null : { action: parsed.action, result: parsed.result };
        }).filter(Boolean);
      } catch (error) {
        console.error("Failed to fetch actions for manifest:", error);
        await this.logErrorToFirebase({
          type: "FirebaseFetchError",
          message: `Failed to fetch actions for manifest: ${error.message}`,
          goalId: selectedGoalId,
        });
      }

      const validation = await this.validateLineWithOpenAI(goalLine.text, startPos, endPos, actions);
      const overallAlignment = parseFloat(validation.overallAlignment) || 0.4;

      const gptResponse = {
        choices: [{ message: { content: JSON.stringify(staticManifestResponse) } }],
      };
      const parsed = this.parseOpenAIManifestResponse(gptResponse);
      const probability = parsed.probability;

      const probPercent = probability * 100;
      let angleDeg, pathStart1, pathEnd1, pathStart2, pathEnd2, target1, target2;
      const maxLength = 100;
      const paths = [];

      const lastAction = actions.find((a) => a.result?.action?.includes("newlocation"));
      const intermediate = lastAction?.result?.coordinates || {
        x: (startPos.x + (targetStart?.x || 0)) / 2,
        y: (startPos.y + (targetStart?.y || 0)) / 2,
        z: (startPos.z + (targetStart?.z || 0)) / 2,
      };

      if (probPercent < 50 && targetStart) {
        angleDeg = Math.min(180, (probPercent / 100) * 360);
        pathStart1 = { x: defaultEnd.x, y: defaultEnd.y, z: defaultEnd.z };
        target1 = intermediate;
        pathStart2 = target1;
        target2 = targetStart;
      } else if (probPercent >= 50 && targetStart) {
        angleDeg = 360 - ((probPercent - 50) / 50) * 180 + 180;
        pathStart1 = { x: targetEnd.x, y: targetEnd.y, z: targetEnd.z };
        target1 = intermediate;
        pathStart2 = target1;
        target2 = defaultStart;
      } else {
        angleDeg = 45;
        pathStart1 = { x: defaultEnd.x, y: defaultEnd.y, z: defaultEnd.z };
        target1 = intermediate;
        pathStart2 = target1;
        target2 = { x: 10, y: 10, z: 10 };
      }

      let length1 = 0;
      try {
        if (!pathStart1 || !target1) {
          throw new Error("pathStart1 or target1 is undefined");
        }
        let baseVector = { x: target1.x - pathStart1.x, z: target1.z - pathStart1.z };
        let baseAngle = (Math.atan2(baseVector.z, baseVector.x) * 180) / Math.PI;
        let finalAngleRad = (baseAngle + angleDeg) * Math.PI / 180;
        let distance = Math.sqrt(
          Math.pow(target1.x - pathStart1.x, 2) +
            Math.pow(target1.y - pathStart1.y, 2) +
            Math.pow(target1.z - pathStart1.z, 2)
        );
        let adjustedTarget1 = {
          x: pathStart1.x + distance * Math.cos(finalAngleRad),
          y: pathStart1.y,
          z: pathStart1.z + distance * Math.sin(finalAngleRad),
        };
        adjustedTarget1.x = Math.max(0, Math.min(100, adjustedTarget1.x));
        adjustedTarget1.z = Math.max(0, Math.min(100, adjustedTarget1.z));
        length1 = Math.min(
          maxLength,
          Math.sqrt(
            Math.pow(adjustedTarget1.x - pathStart1.x, 2) +
              Math.pow(adjustedTarget1.y - pathStart1.y, 2) +
              Math.pow(adjustedTarget1.z - pathStart1.z, 2)
          )
        );
        pathEnd1 = adjustedTarget1;
        paths.push({ start: pathStart1, end: pathEnd1, probability: probability * 0.6, length: length1 });
      } catch (error) {
        await this.logErrorToFirebase({
          type: "PathCalculationError",
          message: error.message,
          goalId: selectedGoalId,
        });
        pathEnd1 = { x: 0, y: 0, z: 0 };
        paths.push({ start: pathStart1 || { x: 0, y: 0, z: 0 }, end: pathEnd1, probability: 0, length: 0 });
      }

      let adjustedTarget2 = { x: 0, y: 0, z: 0 };
      let length2 = 0;
      try {
        if (!pathStart2 || !target2) {
          throw new Error("pathStart2 or target2 is undefined");
        }
        let baseVector = { x: target2.x - pathStart2.x, z: target2.z - pathStart2.z };
        let baseAngle = (Math.atan2(baseVector.z, baseVector.x) * 180) / Math.PI;
        let finalAngleRad = (baseAngle + angleDeg) * Math.PI / 180;
        let distance = Math.sqrt(
          Math.pow(target2.x - pathStart2.x, 2) +
            Math.pow(target2.y - pathStart2.y, 2) +
            Math.pow(target2.z - pathStart2.z, 2)
        );
        adjustedTarget2 = {
          x: pathStart2.x + distance * Math.cos(finalAngleRad),
          y: pathStart2.y,
          z: pathStart2.z + distance * Math.sin(finalAngleRad),
        };
        adjustedTarget2.x = Math.max(0, Math.min(100, adjustedTarget2.x));
        adjustedTarget2.z = Math.max(0, Math.min(100, adjustedTarget2.z));
        length2 = Math.min(
          maxLength,
          Math.sqrt(
            Math.pow(adjustedTarget2.x - pathStart2.x, 2) +
              Math.pow(adjustedTarget2.y - pathStart2.y, 2) +
              Math.pow(adjustedTarget2.z - pathStart2.z, 2)
          )
        );
        pathEnd2 = adjustedTarget2;
        paths.push({ start: pathStart2, end: pathEnd2, probability: probability * 0.4, length: length2 });
      } catch (error) {
        await this.logErrorToFirebase({
          type: "PathCalculationError",
          message: error.message,
          goalId: selectedGoalId,
        });
        pathEnd2 = adjustedTarget2;
        paths.push({ start: pathStart2 || { x: 0, y: 0, z: 0 }, end: pathEnd2, probability: 0, length: 0 });
      }

      if (probPercent < 50 && nextGoalId) {
        this.data.lines[nextGoalId].coordinates = {
          x: adjustedTarget2.x || 0,
          y: adjustedTarget2.y || 0,
          z: adjustedTarget2.z || 0,
        };
      } else if (probPercent >= 50) {
        this.data.lines[selectedGoalId].coordinates = {
          x: adjustedTarget2.x || 0,
          y: adjustedTarget2.y || 0,
          z: adjustedTarget2.z || 0,
        };
      }

      // Find relevant y5Command message
      const scriptMessages = this.script ? this.script.getAllMessagesAsNodes() : [];
      const relevantMessage = scriptMessages.find(
        (msg) => msg.msgType === "y5Command" && msg.senderId === characterId && msg.timestamp >= Math.floor(timestamp / 1000) - 60
      );

      // Generate visual
      const visualData = await generateVisualFromGoal(goalLine, {
        startX: pathStart1?.x || 0,
        startY: pathStart1?.y || 0,
        startZ: pathStart1?.z || 0,
        probability,
        characterId,
        timestamp: Math.floor(timestamp / 1000),
        heavenId: this.data.id,
        goalId: selectedGoalId,
      }, relevantMessage, this.lastManifestationTimestamp);

      if (visualData.error) {
        await this.logErrorToFirebase({
          type: "VisualGenerationError",
          message: visualData.error,
          goalId: selectedGoalId,
        });
      }

      // Update last manifestation timestamp
      this.lastManifestationTimestamp = Math.floor(timestamp / 1000);

      const newHistory = [
        ...manifestationHistory,
        {
          goalId: selectedGoalId,
          characterId,
          actions: manifestationActions,
          timestamp: Math.floor(timestamp / 1000),
          isoTimestamp: new Date(timestamp).toISOString(),
          duration,
          sceneId,
          startX: pathStart1?.x || 0,
          startY: pathStart1?.y || 0,
          startZ: pathStart1?.z || 0,
          endX: pathEnd2?.x || 0,
          endY: pathEnd2?.y || 0,
          endZ: pathEnd2?.z || 0,
          path: paths,
          alignment: overallAlignment,
          probability,
          length: length1 + length2,
          visual: visualData.url,
          visualType: visualData.type,
          visualImages: visualData.images || null,
        },
      ];
      this.data.manifestationHistory = newHistory;
      this.data.lines[selectedGoalId].visual = visualData.url;
      this.data.lines[selectedGoalId].visualType = visualData.type;
      this.data.lines[selectedGoalId].visualImages = visualData.images || null;

      try {
        await this.updateHeavenFirebase();
        await this.saveHeavenData(this.data);
        console.debug(`Manifested goal ${selectedGoalId} with history:`, newHistory);
      } catch (error) {
        await this.logErrorToFirebase({
          type: "PersistenceError",
          message: error.message,
          goalId: selectedGoalId,
        });
        throw error;
      }

      if (parsed.response === "accept" && probability >= 0.7 && overallAlignment >= 0.5) {
        await this.setCurrentGoalInProgress(null);
        return {
          success: true,
          newHistory,
          probability,
          alignment: overallAlignment,
          totalLength: length1 + length2,
          paths,
          visual: visualData.url,
          visualType: visualData.type,
          visualImages: visualData.images || null,
        };
      } else {
        return {
          success: false,
          newHistory,
          probability,
          alignment: overallAlignment,
          totalLength: length1 + length2,
          paths,
          visual: visualData.url,
          visualType: visualData.type,
          visualImages: visualData.images || null,
        };
      }
    } catch (error) {
      await this.logErrorToFirebase({
        type: error.name || "ManifestationError",
        message: error.message,
        goalId: selectedGoalId,
      });
      return { success: false, error: error.message };
    }
  }

  getTitle() {
    return this.data.title;
  }

  updateTitle(title) {
    this.data.title = title || "Untitled Heaven";
    this.validateData();
    this.updateHeavenFirebase();
  }

  getTweets() {
    return this.data.tweets;
  }

  searchForTweets(query) {
    if (!query || typeof query !== "string") return [];
    const lowercaseQuery = query.toLowerCase();
    return this.data.tweets.filter(
      (tweet) =>
        tweet.text.toLowerCase().includes(lowercaseQuery) ||
        tweet.hashtags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getTweetsByCoordinates(x, y, z, tolerance = 0) {
    return this.data.tweets.filter(
      (tweet) =>
        Math.abs(parseFloat(tweet.x) - parseFloat(x)) <= tolerance &&
        Math.abs(parseFloat(tweet.y) - parseFloat(y)) <= tolerance &&
        Math.abs(parseFloat(tweet.z) - parseFloat(z)) <= tolerance
    );
  }

  getLines() {
    return this.data.lines;
  }

  getLinesByTweet(tweetText) {
    return Object.values(this.data.lines).filter((line) => line.tweet === tweetText);
  }

  getLinesByCoordinates(x, y, z, tolerance = 0) {
    return Object.values(this.data.lines).filter(
      (line) =>
        Math.abs(parseFloat(line.coordinates.x) - parseFloat(x)) <= tolerance &&
        Math.abs(parseFloat(line.coordinates.y) - parseFloat(y)) <= tolerance &&
        Math.abs(parseFloat(line.coordinates.z) - parseFloat(z)) <= tolerance
    );
  }

  getLinesByEndCoordinates(x, y, z, tolerance = 0) {
    return Object.values(this.data.lines).filter(
      (line) =>
        Math.abs(parseFloat(line.endX) - parseFloat(x)) <= tolerance &&
        Math.abs(parseFloat(line.endY) - parseFloat(y)) <= tolerance &&
        Math.abs(parseFloat(line.endZ) - parseFloat(z)) <= tolerance
    );
  }

  getLinesByEmotion(primaryEmotion = null, secondaryEmotion = null) {
    return Object.values(this.data.lines).filter(
      (line) =>
        (!primaryEmotion || line.primaryEmotion.toLowerCase() === primaryEmotion.toLowerCase()) &&
        (!secondaryEmotion || line.secondaryEmotion.toLowerCase() === secondaryEmotion.toLowerCase())
    );
  }

  getLinesByObjectState(objectState) {
    if (!objectState) return [];
    return Object.values(this.data.lines).filter((line) => line.objectStates.includes(objectState));
  }

  getLinesByPrecision(isFirst = null, isSecond = null, isThird = null) {
    return Object.values(this.data.lines).filter(
      (line) =>
        (isFirst === null || line.isFirstPrecision === isFirst) &&
        (isSecond === null || line.isSecondPrecision === isSecond) &&
        (isThird === null || line.isThirdPrecision === isThird)
    );
  }

  getCharacters() {
    return this.script ? this.script.getAllCast() : [];
  }

  getStateSnapshots() {
    return this.data.stateSnapshots;
  }

  getManifestationHistory() {
    return this.data.manifestationHistory || [];
  }

  addTweet(tweet) {
    const validatedTweet = this.validateTweets([tweet])[0];
    this.data.tweets.push(validatedTweet);
    this.updateHeavenFirebase();
    return validatedTweet;
  }

  addLine(line) {
    const validatedLine = this.validateLines({ temp: line }).temp;
    const newId = Math.max(...Object.keys(this.data.lines).map(Number), 0) + 1;
    this.data.lines[newId] = validatedLine;
    this.validateData();
    this.updateHeavenFirebase();
    return validatedLine;
  }

  updateStateSnapshots(snapshots) {
    this.data.stateSnapshots = Array.isArray(snapshots) ? snapshots : [];
    this.updateHeavenFirebase();
  }

  updateManifestationHistory(history) {
    this.data.manifestationHistory = Array.isArray(history) ? history : [];
    this.updateHeavenFirebase();
  }

  getScript() {
    return this.script;
  }

  getCurrentGoalInProgress() {
    return this.data.currentGoalInProgress;
  }

  async setScriptId(scriptId) {
    this.data.scriptId = scriptId;
    await this.loadScript();
    this.updateHeavenFirebase();
  }

  getAllData() {
    return {
      ...this.data,
      script: this.script ? this.script.getAllMessagesAsNodes() : [],
    };
  }

  async batchUpdate(tweets = [], lines = []) {
    try {
      this.data.tweets = this.validateTweets(tweets);
      this.data.lines = this.validateLines(lines);
      this.validateData();
      await this.updateHeavenFirebase();
    } catch (error) {
      console.error("Failed to batch update heaven:", error);
      await this.logErrorToFirebase({
        type: "BatchUpdateError",
        message: `Failed to batch update heaven: ${error.message}`,
      });
      throw error;
    }
  }

  calculateDistance(coord1, coord2) {
    return Math.sqrt(
      Math.pow(parseFloat(coord1.x) - parseFloat(coord2.x), 2) +
        Math.pow(parseFloat(coord1.y) - parseFloat(coord2.y), 2) +
        Math.pow(parseFloat(coord1.z) - parseFloat(coord2.z), 2)
    );
  }

  findClosestLines(x, y, z, maxDistance = Infinity, maxResults = 5) {
    const point = { x: parseFloat(x), y: parseFloat(y), z: parseFloat(z) };
    return Object.values(this.data.lines)
      .map((line) => ({
        line,
        distance: this.calculateDistance(line.coordinates, point),
      }))
      .filter((item) => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults)
      .map((item) => item.line);
  }

  async setCurrentGoalInProgress(goalId) {
    if (goalId === this.data.currentGoalInProgress) {
      return;
    }
    const validatedGoalId = goalId !== null && this.data.lines[goalId] ? goalId : null;
    this.data.currentGoalInProgress = validatedGoalId;
    if (!this.saveToFirebase) {
      return;
    }
    try {
      await firebase.updateHeavenField(this.data.id, "currentGoalInProgress", validatedGoalId);
      console.debug(`Updated currentGoalInProgress to ${validatedGoalId} for heaven ${this.data.id}`);
    } catch (error) {
      console.error(
        `setCurrentGoalInProgress: Failed to save currentGoalInProgress=${validatedGoalId} for heaven ${this.data.id}:`,
        error
      );
      await this.logErrorToFirebase({
        type: "FirebaseUpdateError",
        message: `Failed to set currentGoalInProgress: ${error.message}`,
      });
      throw error;
    }
  }

  async executeY5Command(command, script, sceneId) {
    if (!this.thrydObjects || !script) {
      console.error("ThrydObjects or script not initialized");
      alert("Failed to execute command: System not ready");
      return;
    }

    const milliseconds = parseInt(Date.now() / 1000, 10);
    const commandRegex = /^\w+\.\w+\(.*\);?$/;
    if (!commandRegex.test(command.trim())) {
      console.error("Invalid command format:", command);
      script.addNewMessage({
        id: milliseconds,
        timeStamp: milliseconds,
        content: `Error: ${command} (Invalid command format)`,
        emotion: "y5:",
        senderId: "thrydobjects",
        msgType: "y5Command",
        sceneId: sceneId,
      });
      await this.logErrorToFirebase({
        type: "y5Command",
        command,
        error: "Invalid command format",
      });
      return;
    }

    try {
      const actionObj = { command }; // Pass raw command, no context:action split
      console.debug("Executing Y5 command:", { command, actionObj });

      console.log("this.thrydObjects", this.thrydObjects)
      
      const result = await this.thrydObjects.doMovement(this.data.id, milliseconds, actionObj);
      console.log("result", result);
      const moveResult = Array.isArray(result.results) && result.results.length > 0 ? result.results[0] : { error: "No results returned" };

      let content;
      if (moveResult.error) {
        console.error(`Y5 command failed: ${moveResult.error}`);
        content = `Error: ${command} (${moveResult.error})`;
        await this.logErrorToFirebase({
          type: "y5Command",
          command,
          error: moveResult.error,
        });
      } else {
        content = this.safeStringify(moveResult.result);
      }

      script.addNewMessage({
        id: milliseconds,
        timeStamp: milliseconds,
        content,
        emotion: "y5:",
        senderId: "thrydobjects",
        msgType: "y5Command",
        sceneId: sceneId,
      });
      alert("Command executed successfully!");
    } catch (err) {
      console.error("Error executing Y5 command:", err);
      script.addNewMessage({
        id: milliseconds,
        timeStamp: milliseconds,
        content: `Error: ${command} (Unknown error: ${err.message})`,
        emotion: "y5:",
        senderId: "thrydobjects",
        msgType: "y5Command",
        sceneId: sceneId,
      });
      await this.logErrorToFirebase({
        type: "y5Command",
        command,
        error: err.message,
      });
    }
  }
}

export default Heaven;