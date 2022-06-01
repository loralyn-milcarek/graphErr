// deno-lint-ignore-file
import { gql, graphql } from "https://deno.land/x/oak_graphql@0.6.3/deps.ts";
import { ISettings, renderPlaygroundPage} from "https://deno.land/x/oak_graphql@0.6.3/graphql-playground-html/render-playground-html.ts";
import { makeExecutableSchema } from "https://deno.land/x/oak_graphql@0.6.3/graphql-tools/schema/makeExecutableSchema.ts";
import {fileUploadMiddleware, GraphQLUpload } from "https://deno.land/x/oak_graphql@0.6.3/fileUpload.ts";

interface Constructable<T> {
  new(...args: any): T & OakRouter;
}

interface OakRouter {
  post: any;
  get: any;
}

export interface ApplyGraphQLOptions<T> {
  Router: Constructable<T>;
  path?: string;
  typeDefs: any;
  resolvers: ResolversProps;
  context?: (ctx: any) => any;
  usePlayground?: boolean;
  settings?: ISettings;
  extensions: string;
}

export interface ResolversProps {
  Query?: any;
  Mutation?: any;
  [dynamicProperty: string]: any;
}

export async function applyGraphQL<T>({
  Router,
  path = "/graphql",
  typeDefs,
  resolvers,
  context,
  usePlayground = true,
  settings,
  extensions,
}: ApplyGraphQLOptions<T>): Promise<T> {
  const router = new Router();

  const augmentedTypeDefs = Array.isArray(typeDefs) ? typeDefs : [typeDefs];
  augmentedTypeDefs.push(
    gql`
      scalar Upload
    `,
  );
  if (Array.isArray(resolvers)) {
    if (resolvers.every((resolver) => !resolver.Upload)) {
      resolvers.push({ Upload: GraphQLUpload });
    }
  } else {
    if (resolvers && !resolvers.Upload) {
      resolvers.Upload = GraphQLUpload;
    }
  }

  const schema = makeExecutableSchema({
    typeDefs: augmentedTypeDefs,
    resolvers: [resolvers],
  });

  // const newMiddleWare = (ctx: any, next: any) => {
  //   // console.log("this is the new middleware function");
  //   return next();
  // };
  const graphErrLibrary = [
    {
      standardError: `Cannot query field \"dog\" on type \"Media\".`,
      statusCode: 500,
      extensionsMessage: "there's no field called dog",
      specSection: "2. Language",
      url: "https://spec.graphql.org/draft/#sec-Language"
    },
    {
      standardError: `Cannot query field \"cat\" on type \"Media\".`,
      statusCode: 500,
      extensionsMessage: "there's no field called cat",
      specSection: "2. Language",
      url: "https://spec.graphql.org/draft/#sec-Language"
    }
  ];

  type Output = {
    standardError?: string,
      statusCode?: number,
      extensionsMessage?: string,
      specSection?: string,
      url?: string
  }
  const errorHandler = (resBody: any) : object => {
  // option 2: invoke func that looks up the error in our library
  // set each additional response property within function
  // return results in an array
  // [status, extensions, spec]
  //

    // iterate over resBody.errors (after getting it working with first element)
    let output: Output = {};
    for (let i = 0; i < graphErrLibrary.length; i++) {
      if (graphErrLibrary[i].standardError === resBody.errors[0].message) {
        // possibly change later to return here instead to make more performant
        output = graphErrLibrary[i];
      }
    }
    return output;
  }

  await router.post(path, fileUploadMiddleware, async (ctx: any) => {
      const { response, request } = ctx;
      if (request.hasBody) {
        try {
          // console.log(context);
          const contextResult = context ? await context(ctx) : undefined;
          // console.log(contextResult);
          // console.log("context result is:", contextResult);
          const body = ctx.params.operations || await request.body().value;
          const result = await (graphql as any)(
            schema,
            body.query,
            resolvers,
            contextResult,
            body.variables || undefined,
            body.operationName || undefined,
          );
          console.log(result.schema);
          // need to invoke function here (after 'const result...)
          // return next()
          response.body = result;
          
          // console.log(response.status);
          // console.log(1, response);

          if (response.body.errors) {
            // response.status = 500;

            // // option 1: invoke three separate functions that each set their own property
            // response.status = setError(response); // -> 400
            // response.extensions = setExt(res); // -> "this is what the error is"
            // response.spec = setSpec(); // -> "Section 6.1"

            const graphErrObj : Output = errorHandler(response.body);
            response.body.errors[0].extensionsMessage = graphErrObj.extensionsMessage;
            response.status = graphErrObj.statusCode;
            // spec??

            // response.body.errors[0].message = "error occured";
            // response.body.errors.forEach((el: any) => console.log(el.message));
          } else {
            response.status = 200;
            // console.log(2, response);
          }
          
          // we might want to change status code for "errors" that don't throw an error
          // console.log(response.body.errors);
          // response.body.errors[0].dog = "cat";
          // console.log('**** CONTEXT *****', ctx);

          // console.log("test", response.body.dog);
          // response.errors.message = "Hello!!!";
          // console.log("test", response.error.message);
          //response.body.errors[0].message = "hello!!!!!!!";
          // console.log(response.body.errors[0].message);
          return;
        } catch (error) {
          // console.log('line 105 error', error);

          response.status = 200;
          response.body = {
            data: null,
            errors: [
              {
                message: error.message ? error.message : error,
              },
            ],
          };
          return;
        }
      }
    }, 
    (ctx: any, req: any, res: any) => console.log('we did it, avi')
  );

  await router.get(path, async (ctx: any) => {
    console.log(extensions);
    const { request, response } = ctx;
    if (usePlayground) {
      // perform more expensive content-type check only if necessary
      // XXX We could potentially move this logic into the GuiOptions lambda,
      // but I don't think it needs any overriding
      const prefersHTML = request.accepts("text/html");

      if (prefersHTML) {
        const playground = renderPlaygroundPage({
          endpoint: request.url.origin + path,
          subscriptionEndpoint: request.url.origin,
          settings,
        });
        response.status = 200;
        response.body = playground;
        return;
      }
    }
  });

  // await router.get("/", async (ctx) => {
  //   const { request, response } = ctx;
  //   const WS = new SubscriptionServer(
  //     {
  //       schema,
  //       execute: execute as any,
  //       subscribe,
  //       onConnect: onConnect
  //         ? onConnect
  //         : (connectionParams: Object) => ({ ...connectionParams }),
  //       onDisconnect: onDisconnect,
  //       onOperation: async (
  //         message: { payload: any },
  //         connection: any,
  //       ) => {
  //         connection.formatResponse = (value: any) => value;

  //         // connection.formatError = this.requestOptions.formatError;
  //         let contextResult;
  //         try {
  //           contextResult = context ? await context(ctx) : undefined;
  //         } catch (error) {
  //           response.status = 200;
  //           response.body = {
  //             data: null,
  //             errors: [{
  //               message: error.message ? error.message : error,
  //             }],
  //           }
  //         }

  //         return { ...connection, context: contextResult };
  //       },
  //       keepAlive: undefined,
  //       validationRules: undefined
  //     },
  //   );
  // })

  // await router.get("/", async (ctx) => {
  //   if (ctx.isUpgradable) {
  //     const socket = await ctx.upgrade();
  //     socket.send("graphql-ws")
  //     await chat(socket)
  //   }
  // })

  return router;
}
