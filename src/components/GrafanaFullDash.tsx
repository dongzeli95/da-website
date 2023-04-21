import  { useState, useEffect } from 'react';
import GrafanaGraph from './ConversationView/GrafanaGraph';
const axios = require('axios');

const grafanaUrl = "https://grafana-dev-6039-4-1313827042.sh.run.tcloudbase.com"

const GrafanaFullDash = ({ dashboard_id }: { dashboard_id: string }) => {
  const [token, setToken] = useState(null);

  // Replace this URL with the actual URL of your Grafana dashboard
  console.log("token: ", token);
  const grafanaDashboardUrl = grafanaUrl + '/d/' + dashboard_id + '?orgId=1'
  console.log("grafana url: ", grafanaDashboardUrl);
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <GrafanaGraph url={grafanaDashboardUrl} width="100%" height="100%" />
    </div>
  );
};

export default GrafanaFullDash;