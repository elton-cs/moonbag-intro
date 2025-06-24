import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
  split,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";
import { getMainDefinition } from "@apollo/client/utilities";

// Create HTTP link to Torii GraphQL endpoint
const httpLink = createHttpLink({
  uri: "https://api.cartridge.gg/x/moonbagvibes/torii/graphql",
});

// Create WebSocket link for subscriptions
const wsClient = createClient({
  url: "wss://api.cartridge.gg/x/moonbagvibes/torii/graphql",
  connectionParams: () => ({
    // Add any connection parameters if needed
  }),
  on: {
    connected: () =>
      console.log("🔌 WebSocket connected for GraphQL subscriptions"),
    closed: () => console.log("🔌 WebSocket disconnected"),
    error: (error) => console.error("🔌 WebSocket error:", error),
  },
});

const wsLink = new GraphQLWsLink(wsClient);

// Split link: use WebSocket for subscriptions, HTTP for queries and mutations
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === "OperationDefinition" &&
      definition.operation === "subscription"
    );
  },
  wsLink,
  httpLink,
);

// Error link for handling GraphQL and network errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      ),
    );
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);

    // If WebSocket fails, we could implement fallback logic here
    if (networkError.message.includes("WebSocket")) {
      console.warn("🔄 WebSocket connection failed, subscriptions unavailable");
    }
  }
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, splitLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // Moon Bag entity cache policies
      di_MoonRocks: {
        keyFields: ["player"],
      },
      di_Game: {
        keyFields: ["player", "game_id"],
      },
      di_ActiveGame: {
        keyFields: ["player"],
      },
      di_GameCounter: {
        keyFields: ["player"],
      },
      di_OrbBagSlot: {
        keyFields: ["player", "game_id", "slot_index"],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "ignore",
    },
    query: {
      errorPolicy: "all",
    },
  },
});

// Global client setup for window access
declare global {
  interface Window {
    __APOLLO_CLIENT__: typeof apolloClient;
  }
}

export const setupGlobalClient = () => {
  window.__APOLLO_CLIENT__ = apolloClient;
};

// Export WebSocket client for manual control if needed
export const websocketClient = wsClient;
