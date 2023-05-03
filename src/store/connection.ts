import axios from "axios";
import { uniqBy } from "lodash-es";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Connection, Database, Engine, ResponseObject, Table, SSLOptions } from "@/types";
import { generateUUID } from "@/utils";

interface ConnectionContext {
  connection: Connection;
  database?: Database;
}

const samplePGConnection: Connection = {
  id: "sample-pg",
  title: "Sample PostgreSQL",
  engineType: Engine.PostgreSQL,
  host: "db.aqbxmomjsyqbacfsujwd.supabase.co",
  port: "",
  username: "readonly_user",
  password: "bytebase-sqlchat",
  database: "employee",
};

interface ConnectionState {
  connectionList: Connection[];
  databaseList: Database[];
  currentConnectionCtx?: ConnectionContext;
  createConnection: (connection: Connection) => Promise<Connection | undefined>;
  fetchConnections: () => Promise<void>;
  setCurrentConnectionCtx: (connectionCtx: ConnectionContext | undefined) => void;
  getOrFetchDatabaseList: (connection: Connection, skipCache?: boolean) => Promise<Database[]>;
  getOrFetchDatabaseSchema: (database: Database) => Promise<Table[]>;
  getConnectionById: (connectionId: string) => Connection | undefined;
  updateConnection: (connectionId: string, connection: Partial<Connection>) => void;
  clearConnection: (filter: (connection: Connection) => boolean) => void;
}

type DataSource = {
  uid: string;
  name: string;
  type: string;
  url: string;
  database: string;
  access: string;
  user: string;
  password: string;
  jsonData: { [key: string]: string };
};

// Helper function to convert DataSource objects to Connection objects
function dataSourceToConnection(dataSource: DataSource) {
  const [host, port] = dataSource.url.split(':');

  const connection: Connection = {
    id: dataSource.uid, // Assuming dataSource.name is a unique identifier
    title: dataSource.name,
    engineType: dataSource.type == "mysql" ? Engine.MySQL : Engine.PostgreSQL, // You may need to convert this to the appropriate Engine enum value
    host: host,
    port: port,
    username: dataSource.user,
    password: dataSource.password,
    database: dataSource.database,
  };
  return connection;
}

// Use this function to convert the received list of DataSource objects to Connection objects
function convertDataSourcesToConnections(dataSources: DataSource[]) {
  const connections = dataSources.map(dataSourceToConnection);
  return connections;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set, get) => ({
      connectionList: [],
      databaseList: [],
      createConnection: async (connection: Connection) => {
        const response = await fetch("/api/da-be", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ "api_name": "add_datasource", "token": localStorage.getItem('token'), "connection": connection}),
        });

        if (!response.ok) {
          return undefined;
        }

        const data = await response.json();
        if (data === undefined || data.DataSource === undefined) { return undefined; }

        const createdConnection = {
          ...connection,
          id: data.DataSource.uid,
        };
        set((state) => ({
          ...state,
          connectionList: [...state.connectionList, createdConnection],
        }));
        return createdConnection;
      },
      fetchConnections: async () => {
        const response = await fetch("/api/da-be", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ "api_name": "get_datasources", "token": localStorage.getItem('token')}),
        });

        if (!response.ok) {
          return;
        }

        const dataSources = await response.json() as DataSource[];
        const connections = convertDataSourcesToConnections(dataSources);
        set((state) => ({
          ...state,
          connectionList: [...connections],
        }))

        // Set the first connection as the currentConnectionCtx
        if (connections.length > 0) {
          set((state) => ({
            ...state,
            currentConnectionCtx: {
              connection: connections[0],
              database: undefined,
            },
          }));
        }
        return
      },
      setCurrentConnectionCtx: (connectionCtx: ConnectionContext | undefined) =>
        set((state) => ({
          ...state,
          currentConnectionCtx: connectionCtx,
        })),
      getOrFetchDatabaseList: async (connection: Connection, skipCache = false) => {
        const state = get();

        if (!skipCache) {
          if (state.databaseList.some((database) => database.connectionId === connection.id)) {
            return state.databaseList.filter((database) => database.connectionId === connection.id);
          }
        }

        const { data } = await axios.post<string[]>("/api/connection/db", {
          connection,
        });
        const fetchedDatabaseList = data.map(
          (dbName) =>
            ({
              connectionId: connection.id,
              name: dbName,
              tableList: {},
            } as Database)
        );
        const databaseList = uniqBy(
          [...fetchedDatabaseList, ...state.databaseList],
          (database) => `${database.connectionId}_${database.name}`
        );
        set((state) => ({
          ...state,
          databaseList,
        }));
        return databaseList.filter((database) => database.connectionId === connection.id);
      },
      getOrFetchDatabaseSchema: async (database: Database) => {
        const state = get();
        const connection = state.connectionList.find((connection) => connection.id === database.connectionId);
        if (!connection) {
          return [];
        }

        const { data: result } = await axios.post<ResponseObject<Table[]>>("/api/connection/db_schema", {
          connection,
          db: database.name,
        });
        if (result.message) {
          throw result.message;
        }
        return result.data;
      },
      getConnectionById: (connectionId: string) => {
        return get().connectionList.find((connection) => connection.id === connectionId);
      },
      updateConnection: (connectionId: string, connection: Partial<Connection>) => {
        set((state) => ({
          ...state,
          connectionList: state.connectionList.map((item) => (item.id === connectionId ? { ...item, ...connection } : item)),
        }));
      },
      clearConnection: (filter: (connection: Connection) => boolean) => {
        set((state) => ({
          ...state,
          connectionList: state.connectionList.filter(filter),
        }));
      },
    }),
    {
      name: "connection-storage",
    }
  )
);
