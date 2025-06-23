//CODE TO BE TESTED

import firebase from "../../firebase/firebase.js";
import ThrydObjects from "../Heaven/timetravel.js";
import TimeLocationManager from "../Heaven/TimeLocationManager.js";
import heavenFromAI from "./heavenFromAI.json";

class Durella {
  constructor(heavenId = null, data = {}, saveToFirebase = true) {
    this.saveToFirebase = saveToFirebase;
    this.data = null;
    this.thrydObjects = ThrydObjects;
    this.isFiction = heavenFromAI.isFiction || false;
    this.timeLocationManager = new TimeLocationManager(this.isFiction);
    this.data = { id: heavenId || `durella-${Date.now()}`, ...data };
  }

  async logErrorToFirebase(errorData) {
    try {
      await firebase.logError({
        ...errorData,
        durellaId: this.data.id,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error("Failed to log error:", err, errorData);
    }
  }

  static async create(heavenId = null, data = {}, saveToFirebase = true) {
    const durella = new Durella(heavenId, data, saveToFirebase);

    const milliseconds = parseInt(Date.now() / 1000, 10);
    const defaultData = {
      id: heavenId || `durella-${milliseconds}`,
      title: data.title || "Untitled Durella",
      dateCreated: data.dateCreated || milliseconds,
      timeTravelCode: data.timeTravelCode || null,
      stateSnapshots: data.stateSnapshots || [],
      manifestationHistory: Array.isArray(data.manifestationHistory) ? data.manifestationHistory : [],
      currentGoalInProgress: data.currentGoalInProgress || null,
      timetravelfile: data.timetravelfile || null,
    };

    if (heavenId) {
      try {
        await durella.grabDurellaFromFirebase(heavenId);
      } catch (error) {
        console.warn(`Failed to fetch durella ${heavenId} from Firebase, using default data:`, error);
        durella.data = defaultData;
        durella.validateData();
      }
    } else {
      durella.data = defaultData;
      durella.validateData();
    }

    try {
      durella.initializeThrydObjects();
    } catch (error) {
      console.error(`Failed to initialize ThrydObjects for durella ${heavenId}:`, error);
    }

    return durella;
  }

  initializeThrydObjects() {
    this.thrydObjects = ThrydObjects;
    if (
      this.thrydObjects &&
      typeof this.thrydObjects.initiateThrydObjectsAndExecuteMovement === "value"
    ) {
      this.thrydObjects.initiateThrydObjectsAndExecute();
    } else {
      throw new Error("Invalid ThrydObjects or missing initiateThrydObjectsAndExecuteMovement");
    }
  }

  validateData() {
    if (!this.data.title) {
      console.warn("Durella title is empty");
      this.data.title = "Untitled Durella";
    }
    if (!Array.isArray(this.data.manifestationHistory)) {
      console.warn("Invalid manifestationHistory format, resetting to []");
      this.data.manifestationHistory = [];
    }
    if (this.data.currentGoalInProgress !== null && !this.data.timeTravelCode) {
      console.warn(
        `Invalid currentGoalInProgress ${this.data.currentGoalInProgress}, resetting to null`
      );
      this.data.currentGoalInProgress = null;
    }
  }

  async grabDurellaFromFirebase(heavenId) {
    try {
      const val = await firebase.getDataById(heavenId);
      console.debug(`Raw Firebase response for durella ${heavenId}:`, val);
      if (!val) {
        throw new Error(`Durella with ID ${heavenId} not found`);
      }

      this.data = {
        id: val.id || heavenId,
        title: val.title || "Untitled Durella",
        dateCreated: val.dateCreated || parseInt(Date.now() / 1000, 10),
        timeTravelCode: parseInt(val.timeTravelCode, 10) || null,
        stateSnapshots: val.stateSnapshots || [],
        manifestationHistory: Array.isArray(val.manifestationHistory) ? val.manifestationHistory : [],
        currentGoalInProgress: val.currentGoalInProgress !== undefined ? val.currentGoalInProgress : null,
        timetravelfile: val.timetravelfile || null,
      };
      this.validateData();
      return this;
    } catch (error) {
      console.error(`grabDurellaFromFirebase: Failed to load durella ${heavenId}:`, error);
      throw error;
    }
  }

  async sendDurellaToFirebase() {
    if (!this.saveToFirebase) return;
    try {
      await firebase.createNewDurella(this.data);
      console.debug(`Successfully created durella ${this.data.id} in Firebase`);
    } catch (error) {
      console.error("Failed to save durella to Firebase:", error);
      throw error;
    }
  }

  async updateDurellaFirebase() {
    if (!this.saveToFirebase) return;
    try {
      const durellaData = {
        ...this.data,
      };
      await firebase.updateDurella(durellaData);
      console.debug(`Successfully updated durella ${this.data.id} in Firebase:`, {
        manifestationHistory: durellaData.manifestationHistory,
      });
    } catch (error) {
      console.error(`Failed to update durella ${this.data.id} in Firebase:`, error);
      throw error;
    }
  }

  async saveDurellaData(data) {
    try {
      await firebase.saveDurellaData(this.data.id, JSON.stringify(data, null, 2), "durellaData");
      console.debug(`Successfully saved durella data for ${this.data.id}`);
      return true;
    } catch (err) {
      console.error(`Failed to save durella data for ${this.id}:`, err);
      return false;
    }
  }

  async validateLineWithTimeTravelCode(timeTravelCode, characterId, location, timestamp) {
    try {
      if (!timeTravelCode || typeof timeTravelCode !== "number") {
        throw new Error("Invalid timeTravelCode: Must be a number");
      }

      if (!characterId || !this.thrydObjects[characterId]) {
        throw new Error(`Character ${characterId} not found in ThrydObjects`);
      }

      if (!location || !location.x || !location.y || !location.z) {
        throw new Error("Invalid location coordinates");
      }

      if (timestamp < Date.now() && !this.isFiction) {
        throw new Error("Cannot travel to past in non-fiction mode");
      }

      // Validate logical consistency with TimeLocationManager
      try {
        this.timeLocationManager.validateLogicalConsistency(characterId, location, timestamp);
        this.timeLocationManager.setCharacterState(characterId, location, timestamp);
      } catch (error) {
        await this.logErrorToFirebase({
          type: "LogicalConsistencyError",
          message: error.message,
          timeTravelCode,
          characterId,
        });
        throw error;
      }

      // Cross-reference ThrydObjects history
      const history = this.thrydObjects.getHistory() || [];
      const recentMove = history.find((move) => {
        const moveTime = parseInt(move.timestamp);
        return (
          Math.abs(moveTime - timestamp) < this.timeLocationManager.minTimeResolution &&
          move.results.some((r) => r.result?.context === characterId)
        );
      });
      if (recentMove) {
        const moveLocation = recentMove.results.find(
          (r) => r.result?.action === "newlocation" && r.result?.result?.location
        )?.result?.result?.location;
        if (
          moveLocation &&
          (moveLocation.x !== location.x ||
           moveLocation.y !== location.y ||
           moveLocation.z !== location.z)
        ) {
          throw new Error(
            `Character ${characterId} is recorded at a conflicting location (${moveLocation.x}, ${moveLocation.y}, ${moveLocation.z}) at ${new Date(parseInt(move.timestamp)).toISOString()}`
          );
        }
      }

      return {
        valid: true,
        probability: 0.9,
        actions: [{ action: "newlocation", characterId: characterId, location: location }],
      };
    } catch (error) {
      await this.logErrorToFirebase({
        type: error.name || "TimeTravelValidationError",
        message: error.message,
        timeTravelCode,
        characterId,
      });
      return { valid: false, error: error.message };
    }
  }

  async manifest(timeTravelCode, characterId, timelineId = "timeline-1", location = { x: 0, y: 0, z: 0 }, timestamp = Date.now()) {
    try {
      const validation = await this.validateLineWithTimeTravelCode(timeTravelCode, characterId, location, timestamp);
      if (!validation.valid) {
        throw new Error(validation.error || "Time Travel code validation failed");
      }

      const duration = 60 * 1000; // Default duration of 1 minute
      const manifestationHistory = this.data.manifestationHistory || [];

      // Update ThrydObjects with new location
      if (this.thrydObjects[characterId] && this.thrydObjects[characterId].newlocation) {
        this.thrydObjects[characterId].newlocation(location);
      }

      const newHistory = [
        ...manifestationHistory,
        {
          timeTravelCode,
          characterId,
          timestamp: Math.floor(timestamp / 1000),
          isoTimestamp: new Date(timestamp).toISOString(),
          duration,
          timelineId,
          locationX: location.x,
          locationY: location.y,
          locationZ: location.z,
          probability: validation.probability,
          actions: validation.actions,
        },
      ];
      this.data.manifestationHistory = newHistory;

      try {
        await this.updateDurellaFirebase();
        await this.saveDurellaData(this.data);
        console.debug(`Manifested timeTravelCode ${timeTravelCode} with history:`, newHistory);
      } catch (error) {
        await this.logErrorToFirebase({
          type: "PersistenceError",
          message: error.message,
          timeTravelCode,
        });
        throw error;
      }

      return {
        success: true,
        newHistory,
        probability: validation.probability,
      };
    } catch (error) {
      await this.logErrorToFirebase({
        type: error.name || "ManifestationError",
        message: error.message,
        timeTravelCode,
      });
      return { success: false, error: error.message };
    }
  }

  getTitle() {
    return this.data.title;
  }

  updateTitle(title) {
    this.data.title = title || "Untitled Durella";
    this.validateData();
    this.updateDurellaFirebase();
  }

  getStateSnapshots() {
    return this.data.stateSnapshots;
  }

  getManifestationHistory() {
    return this.data.manifestationHistory || [];
  }

  updateStateSnapshots(snapshots) {
    this.data.stateSnapshots = Array.isArray(snapshots) ? snapshots : [];
    this.updateDurellaFirebase();
  }

  updateManifestationHistory(history) {
    this.data.manifestationHistory = Array.isArray(history) ? history : [];
    this.updateDurellaFirebase();
  }

  getCurrentGoalInProgress() {
    return this.data.currentGoalInProgress;
  }

  async setCurrentGoalInProgress(goalId) {
    if (goalId === this.data.currentGoalInProgress) {
      return;
    }
    const validatedGoalId = goalId !== null && this.data.timeTravelCode ? goalId : null;
    this.data.currentGoalInProgress = validatedGoalId;
    if (!this.saveToFirebase) {
      return;
    }
    try {
      await firebase.updateDurellaField(this.data.id, "currentGoalInProgress", validatedGoalId);
      console.debug(`Updated currentGoalInProgress to ${validatedGoalId} for durella ${this.data.id}`);
    } catch (error) {
      console.error(
        `setCurrentGoalInProgress: Failed to save currentGoalInProgress=${validatedGoalId} for durella ${this.data.id}:`,
        error
      );
      throw error;
    }
  }
}

export default Durella;