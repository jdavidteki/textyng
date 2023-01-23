import React from "react";
import EditableField from "../EditableField/EditableField";

import "./Scenes.css";

function Scenes(props) {


  let totalCast = 2

  let defaultScenes = [
    {
      name: "Scene 1",
      id: 1,
    },
    {
      name: "Scene 2",
      id: 2,
    },
  ]

  if(props.scenes){
    defaultScenes = props.scenes
  }

  const [scenes, setScenes] = React.useState(defaultScenes);

  function addNewScene(){
    totalCast +=1

    let newScene = {
      name: "Scene Number",
      id: totalCast
    }

    setScenes(scenes => [...scenes, newScene])
    props.getAllScenes(scenes)
  }

  function updateSceneName(name){
    let id = name[0]
    let newName = name[1]

    for(var i = 0; i<scenes.length; i++){
      if(scenes[i].id == id){
        scenes[i].name = newName
      }
    }

    setScenes(scenes => [...scenes])
    props.getAllScenes(scenes)
  }

  function updateActiveOption(value) {
    var el = document.querySelectorAll(".Scenes-cast");

    for (let i = 0; i < el.length; i++) {
      el[i].classList.remove("active")
    }

    document.getElementById("Scenes-castId-" + value.id).classList.add("active")

    props.selectedScene ? props.selectedScene(value): {};
  }

  return (
    <div className="Scenes">
      {scenes.map(
        (value, index) => (
          <div
            id={"Scenes-castId-" + value.id}
            className="Scenes-cast"
            key={index}
            onClick={() => updateActiveOption(value)}
          >
            <EditableField name={value.name} id={value.id} fontSize={16} getScriptName={updateSceneName} />
          </div>
        )
      )}

      <div className="Scenes-addCast Scenes-cast" onClick={() => addNewScene()}>
        +
      </div>
    </div>
  );
}

export default Scenes;
