import ThrydObjects from "./timetravel.js";

class TimeLocationManager {
  constructor(isFiction = false) {
    this.characterStates = new Map(); // Map<characterId, { location: {x, y, z}, timestamp: number, duration: number }>
    this.travelSpeedNormal = 60 / 3600; // 60 mph in miles/second
    this.travelSpeedHighTraffic = 30 / 3600; // 30 mph in miles/second
    this.minTimeResolution = 60 * 1000; // 1 minute in milliseconds
    this.unitToMiles = 1; // 1 unit = 1 mile
    this.isFiction = isFiction; // Skip physical constraints if true
  }

  // Check if high traffic is active (placeholder)
  isHighTraffic() {
    return ThrydObjects._state.traffic || false;
  }

  // Get travel speed based on traffic
  getTravelSpeed() {
    return this.isHighTraffic() ? this.travelSpeedHighTraffic : this.travelSpeedNormal;
  }

  // Fetch current location from ThrydObjects
  getCurrentLocation(characterId) {
    if (ThrydObjects[characterId] && ThrydObjects[characterId].getlocation) {
      return ThrydObjects[characterId].getlocation();
    }
    return null; // No ThrydObjects entry
  }

  // Add or update a character's state
  setCharacterState(location, timestamp, duration = 60 * 1000) {
    if (!location || !location.x || !location.y || !location.z) {
      throw new Error(`Invalid location for character ${characterId}`);
    }
    if (timestamp < Date.now()) {
      throw new Error(`Cannot set state in the past for character ${characterId}`);
    }
    this.characterStates.set({ location, timestamp, duration });

    // Update ThrydObjects if applicable
    if (ThrydObjects[characterId] && ThrydObjects[characterId].newlocation) {
      ThrydObjects[characterId].newlocation(location);
    }
  }

  // Get a character's state at a specific time
  getCharacterState(timestamp) {
    const state = this.characterStates.get(characterId);
    if (timestamp >= state.timestamp && timestamp <= state.timestamp + state.duration) {
      return state;
    }
    return null;
  }

  // Calculate travel time (in seconds)
  calculateTravelTime(start, end) {
    const distance = Math.sqrt(
      Math.pow(end.x - start.x, 2) +
      Math.pow(end.y - start.y, 2) +
      Math.pow(end.z - start.z, 2)
    ) * this.unitToMiles;
    return distance / this.getTravelSpeed();
  }

  // Logical consistency algorithm
  validateLogicalConsistency(characterId, newLocation, newTimestamp, duration = 60 * 1000) {
    if (this.isFiction) {
      return true; // Skip physical validations
    }

    // Check for overlapping actions
    const currentState = this.getCharacterState(characterId, newTimestamp);
    if (currentState) {
      throw new LogicalConsistencyError(
        `Character ${characterId} is already at (${currentState.location.x}, ${currentState.location.y}, ${currentState.location.z}) at ${new Date(newTimestamp).toISOString()}`
      );
    }

    // Check feasibility of next move
    const lastState = this.characterStates.get(characterId) || {
      location: this.getCurrentLocation(characterId) || { x: 0, y: 0, z: 0 },
      timestamp: Date.now(),
      duration: this.minTimeResolution,
    };
    const travelTime = this.calculateTravelTime(lastState.location, newLocation) * 1000; // ms
    const expectedArrival = lastState.timestamp + lastState.duration + travelTime;
    if (newTimestamp < expectedArrival) {
      throw new LogicalConsistencyError(
        `Character ${characterId} cannot reach (${newLocation.x}, ${newLocation.y}, ${newLocation.z}) by ${new Date(newTimestamp).toISOString()}. Earliest arrival: ${new Date(expectedArrival).toISOString()}`
      );
    }

    // Cross-reference ThrydObjects history
    const history = ThrydObjects.getHistory();
    const recentMoves = history.filter(
      (move) => Math.abs(parseInt(move.timestamp) - newTimestamp) < this.minTimeResolution
    );
    for (const move of recentMoves) {
      const locationAction = move.results.find(
        (r) => r.result?.action === "newlocation" && r.result?.result?.location
      );
      if (locationAction && locationAction.result.context === characterId) {
        const moveLocation = locationAction.result.result.location;
        if (
          moveLocation.x !== newLocation.x ||
          moveLocation.y !== newLocation.y ||
          moveLocation.z !== newLocation.z
        ) {
          throw new LogicalConsistencyError(
            `Character ${characterId} is recorded at (${moveLocation.x}, ${moveLocation.y}, ${moveLocation.z}) at ${new Date(parseInt(move.timestamp)).toISOString()}`
          );
        }
      }
    }

    return true;
  }
}

class LogicalConsistencyError extends Error {
  constructor(message) {
    super(message);
    this.name = "LogicalConsistencyError";
  }
}

export default TimeLocationManager;