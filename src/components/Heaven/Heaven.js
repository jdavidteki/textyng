import firebase from "../../firebase/firebase.js";
import Script from "../Script/Script.js";
import ThrydObjects from "./timetravel.js";

class Heaven {
  constructor(heavenId = null, data = {}, saveToFirebase = true) {
    this.saveToFirebase = saveToFirebase;
    this.script = null;
    this.data = null;
    this.thrydObjects = null;

    this.data = { id: heavenId || `heaven-${Date.now()}` };
  }

  // Utility to safely stringify objects with circular references
  safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]';
        }
        seen.add(value);
      }
      return value;
    }, 2);
  }

  async logErrorToFirebase(errorData) {
    console.error('Failed to log error to Firebase:', errorData);
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
      manifestationHistory: data.manifestationHistory || [],
      currentGoalInProgress: data.currentGoalInProgress || null,
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
      heaven.initializeThrydObjects();
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

  initializeThrydObjects() {
    this.thrydObjects = ThrydObjects;
    if (this.thrydObjects && typeof this.thrydObjects.initiateThrydObjectsAndExecuteMovement === 'function') {
      this.thrydObjects.initiateThrydObjectsAndExecuteMovement();
    } else {
      throw new Error('Invalid ThrydObjects or missing initiateThrydObjectsAndExecuteMovement');
    }
  }

  validateTweets(tweets) {
    return tweets
      .map(tweet => ({
        text: tweet.text || "",
        hashtags: Array.isArray(tweet.hashtags) ? tweet.hashtags : [],
        x: parseFloat(tweet.x) || 0,
        y: parseFloat(tweet.y) || 0,
        z: parseFloat(tweet.z) || 0,
      }))
      .filter(tweet => tweet.text);
  }

  validateLines(lines) {
    return lines
      .map(line => ({
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
        objectStates: typeof line.objectStates === "string" ? line.objectStates.split(", ").map(s => s.trim()) : [],
        isFirstPrecision: !!line.isFirstPrecision,
        isSecondPrecision: !!line.isSecondPrecision,
        isThirdPrecision: !!line.isThirdPrecision,
      }))
      .filter(line => line.text);
  }

  validateData() {
    if (!this.data.title) {
      console.warn("Heaven title is empty");
      this.data.title = "Untitled Heaven";
    }
    if (!this.data.tweets.length && !this.data.lines.length) {
      console.warn("Heaven has no tweets or lines");
    }
    const tweetTexts = new Set(this.data.tweets.map(t => t.text));
    this.data.lines.forEach(line => {
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
      console.warn(`Invalid currentGoalInProgress ${this.data.currentGoalInProgress}, resetting to null`);
      this.data.currentGoalInProgress = null;
    }
  }

  async grabHeavenFromFirebase(heavenId) {
    try {
      const val = await firebase.getHeavenById(heavenId);
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
      this.script = null;
    }
  }

  async sendHeavenToFirebase() {
    if (!this.saveToFirebase) return;
    try {
      await firebase.createNewHeaven(this.data);
    } catch (error) {
      console.error("Failed to save heaven to Firebase:", error);
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
    } catch (error) {
      console.error("Failed to update heaven in Firebase:", error);
      throw error;
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
    return this.data.tweets.filter(tweet =>
      tweet.text.toLowerCase().includes(lowercaseQuery) ||
      tweet.hashtags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  getTweetsByCoordinates(x, y, z, tolerance = 0) {
    return this.data.tweets.filter(tweet =>
      Math.abs(parseFloat(tweet.x) - parseFloat(x)) <= tolerance &&
      Math.abs(parseFloat(tweet.y) - parseFloat(y)) <= tolerance &&
      Math.abs(parseFloat(tweet.z) - parseFloat(z)) <= tolerance
    );
  }

  getLines() {
    return this.data.lines;
  }

  getLinesByTweet(tweetText) {
    return this.data.lines.filter(line => line.tweet === tweetText);
  }

  getLinesByCoordinates(x, y, z, tolerance = 0) {
    return this.data.lines.filter(line =>
      Math.abs(parseFloat(line.coordinates.x) - parseFloat(x)) <= tolerance &&
      Math.abs(parseFloat(line.coordinates.y) - parseFloat(y)) <= tolerance &&
      Math.abs(parseFloat(line.coordinates.z) - parseFloat(z)) <= tolerance
    );
  }

  getLinesByEndCoordinates(x, y, z, tolerance = 0) {
    return this.data.lines.filter(line =>
      Math.abs(parseFloat(line.endX) - parseFloat(x)) <= tolerance &&
      Math.abs(parseFloat(line.endY) - parseFloat(y)) <= tolerance &&
      Math.abs(parseFloat(line.endZ) - parseFloat(z)) <= tolerance
    );
  }

  getLinesByEmotion(primaryEmotion = null, secondaryEmotion = null) {
    return this.data.lines.filter(line =>
      (!primaryEmotion || line.primaryEmotion.toLowerCase() === primaryEmotion.toLowerCase()) &&
      (!secondaryEmotion || line.secondaryEmotion.toLowerCase() === secondaryEmotion.toLowerCase())
    );
  }

  getLinesByObjectState(objectState) {
    if (!objectState) return [];
    return this.data.lines.filter(line => line.objectStates.includes(objectState));
  }

  getLinesByPrecision(isFirst = null, isSecond = null, isThird = null) {
    return this.data.lines.filter(line =>
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
    const validatedLine = this.validateLines([line])[0];
    this.data.lines.push(validatedLine);
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
    return this.data.lines
      .map(line => ({
        line,
        distance: this.calculateDistance(line.coordinates, point),
      }))
      .filter(item => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults)
      .map(item => item.line);
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
    } catch (error) {
      console.error(`setCurrentGoalInProgress: Failed to save currentGoalInProgress=${validatedGoalId} for heaven ${this.data.id}:`, error);
      throw error;
    }
  }

  executeY5Command(command, script, castId, sceneId) {
    if (!this.thrydObjects || !script) {
      console.error('ThrydObjects or script not initialized');
      alert('Failed to execute command: System not ready');
      return;
    }

    const milliseconds = parseInt(Date.now() / 1000, 10);

    try {
      const [context, actionStr] = command.trim().split(':').map(s => s.trim());
      const actionObj = { type: 'executeCommand', command };
      console.debug('Executing Y5 command:', { command, actionObj, actionHandlers: Object.keys(this.thrydObjects.actionHandlers) });

      const result = this.thrydObjects.doMovement(milliseconds, actionObj);
      const moveResult = result.results[0];

      let content;
      if (moveResult.error) {
        console.error(`Y5 command failed: ${moveResult.error}`);
        content = `Error: ${command} (${moveResult.error})`;
        this.logErrorToFirebase({
          type: 'y5Command',
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
        senderId: castId,
        msgType: "y5Command",
        sceneId: sceneId,
      });
      alert('Command executed successfully!');
    } catch (err) {
      console.error('Error executing Y5 command:', err);
      script.addNewMessage({
        id: milliseconds,
        timeStamp: milliseconds,
        content: `Error: ${command} (Unknown error: ${err.message})`,
        emotion: "y5:",
        senderId: castId,
        msgType: "y5Command",
        sceneId: sceneId,
      });
      this.logErrorToFirebase({
        type: 'y5Command',
        command,
        error: err.message,
      });
    }
  }
}

export default Heaven;