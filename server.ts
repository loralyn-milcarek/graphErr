import { Application, Router } from "https://deno.land/x/oak@v10.0.0/mod.ts";
import { applyGraphQL } from "./applyGQL.ts"
// import { GQLError, applyGraphQL } from "https://deno.land/x/oak_graphql@0.6.3/mod.ts";
import { typeDefs } from "./typedefs.ts";
import { resolvers } from "./resolvers/resolvers.ts";
// import { Animal } from "./interface.ts";

const app = new Application();

// interface Dog extends Animal {
//   breed: string;
// }

// const doggo: Dog = {
//   name: 'hello',
//   breed: 'world'
// };
// console.log(doggo);

// interface addExtensions extends ApplyGraphQLOptions <Router<Record<string, unknown>>> {
//   testProp: string;
// }


const GraphQLService = await applyGraphQL<Router>({
  Router,
  typeDefs: typeDefs,
  resolvers: resolvers,
  extensions: 'hello',
  // dogs: 'cat'
  // testProp: 'hello world',
  // do we need this?
  // context: (ctx) => {
  //     // this line is for passing a user context for the auth
  //   return { user: "Aaron" };
  // }
})

const graphErr = (next: any) => {
  console.log('this is the graphErr function');
  return next();
}

app.use(GraphQLService.routes(), GraphQLService.allowedMethods(), graphErr(() => console.log('done')));

await app.listen({ port: 3000 });
