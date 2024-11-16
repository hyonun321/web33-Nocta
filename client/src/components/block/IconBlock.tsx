import React from "react";

interface IconBlocknProps {
  type: string;
  index?: number; // ol일 때 순서를 위한 prop
}

export const IconBlock: React.FC<IconBlocknProps> = ({ type, index }) => {
  let content;

  if (type === "ul") {
    content = (
      <div style={{ marginRight: "8px" }}>
        <span>•</span>
      </div>
    );
  } else if (type === "ol") {
    content = (
      <div style={{ marginRight: "8px" }}>
        <span>{index}.</span>
      </div>
    );
  } else if (type === "checkbox") {
    content = (
      <div style={{ marginRight: "8px" }}>
        <input type="checkbox" />
      </div>
    );
  } else {
    content = null;
  }

  return content;
};
