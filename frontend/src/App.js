import React from "react";
import "@/App.css";
import "@/index.css";
import GamePage from "@/pages/GamePage";

function App() {
  return (
    <div className="App" data-testid="app-root">
      <GamePage />
    </div>
  );
}

export default App;
