// GrafanaGraph.tsx
import React from "react";

interface GrafanaGraphProps {
  url: string;
  width?: string;
  height?: string;
}

const GrafanaGraph: React.FC<GrafanaGraphProps> = ({ url, width = "100%", height = "400px" }) => {
  return (
    <iframe
      src={url}
      width={width}
      height={height}
      frameBorder="0"
      allowFullScreen={true}
    ></iframe>
  );
};

export default GrafanaGraph;