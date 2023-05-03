import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Organization } from "@/types";

interface GrafanaState {
    getState: () => GrafanaState;
    fetchOrganizations: () => Promise<void>;
    organizationList: Organization[];
    currentOrganization?: Organization;
}

export const useGrafanaStore = create<GrafanaState>()(
    persist(
        (set, get) => ({
            getState: () => get(),
            organizationList: [],
            fetchOrganizations: async () => {
                const response = await fetch("/api/da-be", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ "api_name": "get_user_organizations", "token": localStorage.getItem('token')}),
                  });

                if (!response.ok) {
                    return;
                }
          
                const data = await response.json() as Organization[];

                set((state) => ({
                    ...state,
                    connectionList: [...data],
                  }));

                set((state) => ({
                    ...state,
                    currentOrganization: data[0],
                }))
                return
            },
        }),
        {
            name: "grafana-storage",
        }
    )
);