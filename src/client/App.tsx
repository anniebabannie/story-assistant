import "./App.css";

import { useState } from "react";

function App() {
  const [result, setResult] = useState<string | null>(null);

  const generate = async () => {
    const response = await fetch("/characters", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    console.log(JSON.parse(data.result));
    setResult(data.result);
  };
  return (
    <div>
      <button onClick={generate}>Generate</button>
      {result}
    </div>
  );
}

export default App;
