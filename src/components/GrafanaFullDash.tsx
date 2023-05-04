import { useState, useEffect } from "react";
import GrafanaGraph from "./ConversationView/GrafanaGraph";
import { useGrafanaStore } from "@/store";
import { grafanaUrl } from "@/components/constants";

const GrafanaFullDash = ({ dashboard_id }: { dashboard_id: string }) => {
  const grafanaStore = useGrafanaStore();
  const [grafanaDashboardUrl, setGrafanaDashboardUrl] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    console.log("grafana url: ", grafanaUrl);
    console.log(
      "grafanaStore.currentOrganization: ",
      grafanaStore.currentOrganization?.orgId
    );
    console.log("dashboard_id: ", dashboard_id);
    if (
      dashboard_id &&
      grafanaUrl &&
      grafanaStore.currentOrganization &&
      token
    ) {
      setGrafanaDashboardUrl(
        grafanaUrl +
          "/d/" +
          dashboard_id +
          "?orgId=" +
          grafanaStore.currentOrganization?.orgId +
          "&auth_token=" +
          token
      );
    }
  }, [dashboard_id, grafanaUrl, grafanaStore.currentOrganization, token]);

  if (
    !grafanaDashboardUrl ||
    grafanaStore.currentOrganization === undefined ||
    token === undefined
  ) {
    return <div>Loading...</div>;
  }

  console.log("Newly Generated URL:", grafanaDashboardUrl);
  console.log("Token:", token);
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      <GrafanaGraph url={grafanaDashboardUrl} width="100%" height="100%" />
    </div>
  );
};

export default GrafanaFullDash;
