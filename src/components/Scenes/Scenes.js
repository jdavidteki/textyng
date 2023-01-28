import React from "react";
import EditableField from "../EditableField/EditableField";

import "./Scenes.css";

function Scenes(props) {
  let defaultScenes = [
    {
      name: "Bombay",
      id: 1,
    },
    {
      name: "Sheraton Hostel",
      id: 2,
    },
  ];

  const [scenes, setScenes] = React.useState(props.scenes && props.scenes.length > 0 ? props.scenes : defaultScenes);
  const [totalScenes, setTotalScenes] = React.useState(props.scenes && props.scenes.length > 0 ? props.scenes.length : defaultScenes.length);

  function addNewScene() {
    let newScene = {
      name: "Scene",
      id: totalScenes + 1,
    };
    setScenes(scenes => [...scenes, newScene]);
    setTotalScenes(totalScenes + 1);
    props.getAllScenes(scenes);
  }

  function updateSceneName(name) {
    let id = name[0];
    let newName = name[1];

    for (var i = 0; i < scenes.length; i++) {
      if (scenes[i].id == id) {
        scenes[i].name = newName;
      }
    }

    setScenes(scenes => [...scenes]);
    props.getAllScenes(scenes);
  }

  function updateActiveOption(value) {
    var el = document.querySelectorAll(".Scenes-scene");

    for (let i = 0; i < el.length; i++) {
      el[i].classList.remove("active");
    }

    document.getElementById("Scenes-sceneId-" + value.id).classList.add("active");

    props.selectedScene ? props.selectedScene(value) : {};
  }

  return (
    <div className="Scenes">
      {scenes.map(
        (value, index) => (
          <div
            id={"Scenes-sceneId-" + value.id}
            className="Scenes-scene"
            key={index}
            onClick={() => updateActiveOption(value)}
          >
            <EditableField name={value.name} id={value.id} fontSize={16} getScriptName={updateSceneName} />
          </div>
        )
      )}

      <div className="Scenes-addScene Scenes-scene" onClick={() => addNewScene()}>
        +
      </div>
    </div>
  );
}

export default Scenes;
