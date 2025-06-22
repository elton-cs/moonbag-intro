import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from "@apollo/client";
import { onError } from "@apollo/client/link/error";

// Create HTTP link to Torii GraphQL endpoint
const httpLink = createHttpLink({
  uri: "http://localhost:8080/graphql",
});

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
  }
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      // Configure cache policies for Dojo entities
      Position: {
        keyFields: ["player"],
      },
      Moves: {
        keyFields: ["player"],
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
