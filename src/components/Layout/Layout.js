import React, { Component, lazy, Suspense } from "react";
import Footer from "../Footer/Footer.js";
import Header from "../Header/Header.js";

import "./Layout.css";

const HomePage = lazy(() => import("../HomePage/HomePage.js"));
const NewScript = lazy(() => import("../NewScript/NewScript.js"));
const ReaderView = lazy(() => import("../ReaderView/ReaderView.js"));
const EditScript = lazy(() => import("../EditScript/EditScript.js"));
const SearchScripts = lazy(() => import("../SearchScripts/SearchScripts.js"));
const Conversation = lazy(() => import("../Conversation/Conversation.js"));
const ScriptGenerator = lazy(() => import("../ScriptGenerator/ScriptGenerator.js"));
const GroupChat = lazy(() => import("../GroupChat/GroupChat.js"));
const ImageToVideo = lazy(() => import("../../ImageToVideo/ImageToVideo.js"));
const Fylds = lazy(() => import("../../components/Fylds/Fylds.js"));
const PygPal = lazy(() => import("../../components/PygPal/PygPal.js"));
const GrypchtAddData = lazy(() => import("../Grypcht/GrypchtAddData.js"));
const MediumScraper = lazy(() => import("../MediumScraper/MediumScraper.js"));
const SweducerWorkstation = lazy(() => import("../SweducerWorkstation/SweducerWorkstation.js"));
const SendHeavenToAI = lazy(() => import("../SendHeavenToAI/SendHeavenToAI.js"));
const ArtistWorkstation = lazy(() => import("../ArtistWorkstation/ArtistWorkstation.js"));
const CustomerWorkstation = lazy(() => import("../CustomerWorkstation/CustomerWorkstation.js"));

class Layout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      pageName: this.props.pageName
    };
  }

  componentDidMount() {
    // hack: use this to fix github pages doing ?/ on pages
    if (window.location.href.includes("?/")) {
      let actualDestination = window.location.href.split("?/")[1];

      this.props.history.push({
        pathname: "/" + actualDestination
      });
    }

    document.getElementById("layoutContent").classList.add(this.state.pageName);
  }

  componentDidUpdate() {
    const layoutContent = document.getElementById("layoutContent");

    layoutContent.className = "";

    layoutContent.classList.add("Layout-content");
    layoutContent.classList.add(this.state.pageName);
  }

  changePage = (pageToChange) => {
    window.history.pushState("", "New Page Title", "/" + pageToChange);
    this.setState({ pageName: pageToChange });
  };

  render() {
    return (
      <div className="Layout">
        <div className="Layout-header">
          <Header changePage={this.changePage} />
        </div>
        <div className="Layout-content" id="layoutContent">
          <Suspense fallback={<div>Loading...</div>}>
            {this.state.pageName === "textyng" && <HomePage changePage={this.changePage} />}
            {this.state.pageName === "newscript" && <NewScript changePage={this.changePage} />}
            {this.state.pageName === "readerview" && <ReaderView changePage={this.changePage} />}
            {this.state.pageName === "editscript" && <EditScript changePage={this.changePage} />}
            {this.state.pageName === "searchscripts" && <SearchScripts changePage={this.changePage} />}
            {this.state.pageName === "conversation" && <Conversation changePage={this.changePage} />}
            {this.state.pageName === "scriptgenerator" && <ScriptGenerator changePage={this.changePage} />}
            {this.state.pageName === "groupchat" && <GroupChat changePage={this.changePage} />}
            {this.state.pageName === "imagetovideo" && <ImageToVideo changePage={this.changePage} />}
            {this.state.pageName === "fylds" && <Fylds changePage={this.changePage} />}
            {this.state.pageName === "pygpal" && <PygPal changePage={this.changePage} />}
            {this.state.pageName === "grypchtadddata" && <GrypchtAddData changePage={this.changePage} />}
            {this.state.pageName === "mediumscraper" && <MediumScraper changePage={this.changePage} />}
            {this.state.pageName === "sweducerworkstation" && <SweducerWorkstation changePage={this.changePage} />}
            {this.state.pageName === "sendheaventoai" && <SendHeavenToAI changePage={this.changePage} /> }
            {this.state.pageName === "artistworkstation" && <ArtistWorkstation changePage={this.changePage} />}
            {this.state.pageName === "customerworkstation" && <CustomerWorkstation changePage={this.changePage} />}            
          </Suspense>
        </div>
        <div className="Layout-footer">
          <Footer />
        </div>
      </div>
    );
  }
}

export default Layout;
