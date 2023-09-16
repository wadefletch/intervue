import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import React from "react";

const data = [
  {
    CardTitle: "Card 1",
    CardDescription: "Card Description",
    CardContent: "Card Content",
    CardFooter: ["test1", "test2"],
  },
  {
    CardTitle: "Card 2",
    CardDescription: "Card Description",
    CardContent: "Card Content",
    CardFooter: ["Card Footer"],
  },
  {
    CardTitle: "Card 3",
    CardDescription: "Card Description",
    CardContent: "Card Content",
    CardFooter: ["Card Footer"],
  },
];

function LeftPanel() {
  return (
    <div
      className="left-panel"
      style={{
        /// here is where you can style the left panel
        overflowY: "auto",
        border: "1px solid #ccc",
        padding: "20px",
        height: "100%", // Set the height to 100%
      }}
    >
      {/* Content with vertical scroll */}
      <ScrollArea className="h-[300px] w-[350px] rounded-md border p-4">
        {data.map((item, index) => (
          <div key={index}>
            <Card>
              <CardHeader>
                <CardDescription>{item.CardDescription}</CardDescription>
                <CardTitle>{item.CardTitle}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{item.CardContent}</p>
              </CardContent>
              <CardFooter>
                {item.CardFooter.map((line, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    <Badge>{line}</Badge>
                    {lineIndex < item.CardFooter.length - 1 && " "}{" "}
                    <div style={{ marginRight: "7px" }}></div>
                  </React.Fragment>
                ))}
              </CardFooter>
            </Card>

            {index < data.length - 1 && (
              <div style={{ marginBottom: "12px" }}></div>
            )}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}

function CenterPanel() {
  return (
    <div
      className="center-panel"
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        height: "100%", // Set the height to 100%
      }}
    >
      {/* Content with no scrolling */}
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. ...</p>
    </div>
  );
}

function FixedPart() {
  return (
    <div
      className="fixed-part"
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        height: "100%", // Set the height to 100%
      }}
    >
      {/* Fixed content */}
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. ...</p>
    </div>
  );
}

function BottomPart() {
  return (
    <div
      className="bottom-part"
      style={{
        border: "1px solid #ccc",
        padding: "20px",
        marginTop: "auto",
        marginBottom: "auto",
      }}
    >
      {/* Content aligned to the bottom */}
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. ...</p>
    </div>
  );
}

function App() {
  return (
    <div className="main-container" style={{ display: "flex", height: "100%" }}>
      <LeftPanel />
      <CenterPanel />
      <div
        className="right-panel"
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
      >
        <FixedPart />
        <BottomPart />
      </div>
    </div>
  );
}

export default App;
