import { ApolloServer } from "apollo-server-express";
import express from "express";
import mongoose from "mongoose";
import User from "./models/User.js";
import jwt from "jsonwebtoken";
import typeDefs from "./graphql/typedefs.js";
import resolvers from "./graphql/resolvers.js";

const JWT_SECRET = "my-top-secret";

const verifyToken = (token) => {
  if (!token) return null;
  //Bearer token
  const [schema, newToken] = token.split(" ");
  if (!newToken) return null;
  try {
    return jwt.verify(newToken, JWT_SECRET);
  } catch {
    return null;
  }
};

async function start() {
  const app = express();
  //graphql & apollo
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const token = req.headers.authorization;
      const decodedToken = verifyToken(token);
      if (!decodedToken) return { user: null };
      const user = await User.findOne({ email: decodedToken.email });
      return { user };
    },
  });
  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  app.listen(5000, () => {
    console.log(`Server is running on port 5000`);
    //connect to mongodb
    mongoose
      .connect(
        "mongodb+srv://mayarabdelbasser539_db_user:docsaad@cluster0.xq5rxki.mongodb.net/graphql"
      )
      .then(() => console.log("✅✅ connected to mongodb successfully"))
      .catch((err) => console.log("❌❌ connection can not be established"));
  });
}
start();
