import { Router } from "https://deno.land/x/oak@v10.0.0/mod.ts";
import { applyGraphQL, GQLError } from "https://deno.land/x/oak_graphql@0.6.3/mod.ts";

import { typeDefs } from "./typedefs.ts";
import { resolvers } from "./resolvers.ts";

function graphErr() {
  // options here?
  return function middlewareFunction(request, response) {
    // error handling here
    const extensions = ({request, response}) => {
      return {Testing: 'Testing Value'}
    }

    console.log('request.context:', request.context);
    console.log('response.context:', response.context);

    return applyGraphQL<Router>({
      Router,
      typeDefs: typeDefs,
      resolvers: resolvers,
      context: (ctx) => {
          // this line is for passing a user context for the auth
        return { user: "Aaron" };
      }
    })
  }
}

export default graphErr;

// applyGraphQL options
// Router: oak Router module
// Due to the version incompatible issue mentioned by (avalero)[https://github.com/avalero], I've decoupled the Router. Thanks :)
// path?: string
// A target path that handles the GraphQL post request (*optional: default as /graphql)
// typeDefs: any
// generated type tags by the gql
// resolvers: any
// An object that handles the queries and mutations