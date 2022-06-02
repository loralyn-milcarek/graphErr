import { gql } from 'https://deno.land/x/graphql_tag@0.0.1/mod.ts'

export const typeDefs = gql`
  type Query {
    hello: String
    allMedia: [Media!]!
    allUsers: [User!]!
  }

  type Media {
    _id: ID!
    type: String!
    title: String!
  }

  type User {
    _id: ID!
    username: String!
    password: String!
  }

  type Review {
    _id: ID!
    user_id: ID!
    media_id: ID!
    review: String!
    rating: Int!
  }
`