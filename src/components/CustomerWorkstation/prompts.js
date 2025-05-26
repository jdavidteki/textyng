export const MANIFEST_PROMPT = `
You are an expert at determining if a goal manifests in a time-travel narrative. Below is the content of timetravel.js, which defines ThrydObjects with an initiateThrydObjectsAndExecuteMovement() method that logs object state updates using doMovement(timestamp, ...actions) with UNIX timestamps. These updates are managed by script.js based on actions (e.g., "he drops the cup in the kitchen" might trigger cup.updateLocation(kitchen.location)). Your task is to analyze the sequence of state updates and determine if the given goal line is logically plausible, using narrative intuition. If a required state is missing, treat it as an external force preventing manifestation.

timetravel.js content:
{{TIME_TRAVEL_CODE}}

Goal: "{{GOAL_TEXT}}"
Emotion: {{PRIMARY_EMOTION}} ({{SECONDARY_EMOTION}})
Coordinates: ({{COORD_X}}, {{COORD_Y}}, {{COORD_Z}})
End Coordinates: ({{END_X}}, {{END_Y}}, {{END_Z}})
Object States: {{OBJECT_STATES}}
State Snapshots: {{STATE_SNAPSHOTS}}

Instructions:
1. Parse the initiateThrydObjectsAndExecuteMovement() method to extract all doMovement calls and their timestamps.
2. Evaluate the sequence of object state updates to determine if they support the goal line's plausibility.
3. Use narrative intuition to connect object movements to the goal, considering coordinates, end coordinates, object states, and emotions.
4. If a required state or context is missing, identify it as an external force preventing manifestation.
5. Return {"response": "accept", "probability": <number>, "reasoning": "<explanation>"} if probability > 0.7, else {"response": "decline", "probability": <number>, "reasoning": "<explanation>"}.
`;