import  { useState, useEffect } from 'react';
import GrafanaGraph from './ConversationView/GrafanaGraph';

const GrafanaFullDash = ({ dashboard_id }: { dashboard_id: string }) => {
  const [token, setToken] = useState(null);
  const grafanaUrl = process.env.GRAFANA_URL;
  const grafanaDashboardUrl = grafanaUrl + '/d/' + dashboard_id + '?orgId=1'
  
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      <GrafanaGraph url={grafanaDashboardUrl} width="100%" height="100%" />
    </div>
  );
};

export default GrafanaFullDash;