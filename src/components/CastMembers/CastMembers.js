import React from "react";
import EditableField from "../EditableField/EditableField";

import "./CastMembers.css";

function CastMembers(props) {


  let totalCast = 2

  let defaultCast = [
    {
      name: "Jesuye David",
      id: 1,
    },
    {
      name: "Cast Member",
      id: 2,
    },
  ]

  if(props.cast){
    defaultCast = props.cast
  }

  const [casts, setCast] = React.useState(defaultCast);

  function addNewCastMember(){
    totalCast +=1

    let newCast = {
      name: "Cast Member",
      id: totalCast
    }

    setCast(casts => [...casts, newCast])
    props.getAllCast(casts)
  }

  function udpateCastName(name){
    let id = name[0]
    let newName = name[1]

    for(var i = 0; i<casts.length; i++){
      if(casts[i].id == id){
        casts[i].name = newName
      }
    }

    setCast(casts => [...casts])
    props.getAllCast(casts)
  }

  function updateActiveOption(value) {
    var el = document.querySelectorAll(".CastMembers-cast");

    for (let i = 0; i < el.length; i++) {
      el[i].classList.remove("active")
    }

    document.getElementById("CastMembers-castId-" + value.id).classList.add("active")

    props.selectedCast ? props.selectedCast(value): {};
  }

  return (
    <div className="CastMembers">
      {casts.map(
        (value, index) => (
          <div
            id={"CastMembers-castId-" + value.id}
            className="CastMembers-cast"
            key={index}
            onClick={() => updateActiveOption(value)}
          >
            <EditableField name={value.name} id={value.id} fontSize={16} getScriptName={udpateCastName} />
          </div>
        )
      )}

      <div className="CastMembers-addCast CastMembers-cast" onClick={() => addNewCastMember()}>
        +
      </div>
    </div>
  );
}

export default CastMembers;
