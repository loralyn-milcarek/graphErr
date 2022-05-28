import userController from '../controllers/userControllers.ts';
import mediaController from '../controllers/mediaControllers.ts';
import reviewController from '../controllers/reviewControllers.ts';

export const resolvers = { 
  Query: { 
    hello: () => `Hello World!`, 
    allMedia: () => mediaController.pullAllMedia(),
    allUsers: () => userController.pullAllUsers(),
    // allReviews: () => reviewController.pullAllReviews()
  }, 
  // Mutation: {
  //   insertPosition: (_: any, args: any ) => console.log(args)
  // }
}