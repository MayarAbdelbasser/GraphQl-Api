import { ApolloServer, gql } from "apollo-server-express";
import express from "express";
import Course from "./models/Course.js";
import Student from "./models/Student.js";
import mongoose from "mongoose";
import Enrollment from "./models/Enrollment.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "my-top-secret";

const typeDefs = gql`
  type Student {
    id: ID
    name: String!
    email: String!
    age: Int!
    major: String!
    courses: [Course!]
  }
  type Course {
    id: String!
    title: String!
    credits: Int!
    instructor: String!
    students: [Student!]
  }
  type Enrollment {
    id: ID!
    studentId: ID!
    courseId: ID!
  }
  type Query {
    getStudents: [Student!]!
    getStudentById(id: ID!): Student

    getCourses: [Course!]!
    getCourseById(id: ID!): Course

    searchStudentsByMajor(major: String!): [Student!]!
  }

  input CreateStudentInput {
    name: String!
    email: String!
    age: Int!
    major: String!
  }
  input CreateCourseInput {
    title: String!
    code: String!
    credits: Int!
    instructor: String!
  }

  input UpdateStudentInput {
    name: String
    email: String
    age: Int
    major: String
  }
  input UpdateCourseInput {
    title: String
    code: String
    credits: Int
    instructor: String
  }
  input createUserInput {
    email: String!
    password: String!
  }
  type User {
    id: ID!
    email: String!
  }
  type AuthPayload {
    token: String!
    user: User!
  }
  type Mutation {
    createStudent(input: CreateStudentInput!): Student!
    deleteStudent(id: ID!): Student
    updateStudent(id: ID!, input: UpdateStudentInput!): Student!

    createCourse(input: CreateCourseInput!): Course!
    deleteCourse(id: ID!): Course!
    updateCourse(id: ID!, input: UpdateCourseInput!): Course!

    enrollStudent(studentId: ID!, courseId: ID!): Student!
    unenrollStudent(studentId: ID!, courseId: ID!): Student!

    signup(input: createUserInput!): AuthPayload!
    login(email: String!, password: String!): AuthPayload
  }
`;
const resolvers = {
  Query: {
    //get all students
    getStudents: async () => {
      const students = await Student.find({});
      return students;
    },
    //get student by Id
    getStudentById: async (_, { id }) => {
      try {
        const student = await Student.findOne({ _id: id });
        return student;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to fetch student");
      }
    },

    getCourses: () => courses,
    getCourseById: (_, { id }) => {
      return courses.find((c) => c.id === id);
    },

    searchStudentsByMajor: async (_, { major }) => {
      const students = await Student.find({
        major: { $regex: major, $options: "i" },
      });
      return students;
    },
  },

  Mutation: {
    //create user
    signup: async (_, { input: { email, password } }) => {
      //? 1)make sure email is not exists
      const userExists = await User.findOne({ email: email });
      if (userExists) throw new Error("Email already exists");

      //? 2)hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      //? 3)create user
      try {
        const user = await User.create({ email, password: hashedPassword });

        //? 4)create jwt toke
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
        return {
          token: token,
          user,
        };
      } catch (err) {
        throw new Error("Failed to create user");
      }
    },
    //login
    login: async (_, { email, password }) => {
      //? 1)make sure email exists
      const user = await User.findOne({ email: email });
      if (!user) throw new Error("Email doesn't exists");

      //? 2)compare password
      const isPasswordMatched = await bcrypt.compare(password, user.password);
      if (!isPasswordMatched) throw new Error("Password is not correct");

      try {
        //? 4)create jwt toke
        const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "7d" });
        return {
          token: token,
          user,
        };
      } catch (err) {
        throw new Error("Failed to create user");
      }
    },
    //create student
    createStudent: async (_, { input }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      try {
        const student = await Student.create(input);
        return student;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to create student");
      }
    },
    //delete student
    deleteStudent: async (_, { id }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      try {
        const student = await Student.findOneAndDelete({ _id: id });
        return student;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to create student");
      }
    },
    //update Students
    updateStudent: async (_, { id, input }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      const { name, email, major, age } = input;
      let student = await Student.findOneAndUpdate(
        { _id: id },
        { name, email, age, major },
        { new: true }
      );
      if (!student) {
        throw new Error("Student Id not found");
      }
      return student;
    },

    //create course
    createCourse: async (_, { input }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      try {
        const course = await Course.create(input);
        return course;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to create course");
      }
    },
    //delete course
    deleteCourse: async (_, { id }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      try {
        const course = await Course.findOneAndDelete({ _id: id });
        return course;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to delete student");
      }
    },
    //update course
    updateCourse: async (_, { id, input }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      const { title, code, credits, instructor } = input;
      let course = await Course.findOneAndUpdate(
        { _id: id },
        { title, code, credits, instructor },
        { new: true }
      );
      if (!course) {
        throw new Error("Course Id not found");
      }
      return course;
    },
    //enroll student
    enrollStudent: async (_, { studentId, courseId }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");

      const student = await Student.findById(studentId);
      if (!student) throw new Error("Student not found");
      const course = await Course.findById(courseId);
      if (!course) throw new Error("Course not found");

      const existing = await Enrollment.findOne({ studentId, courseId });
      if (existing) return student;

      try {
        await Enrollment.create({ studentId, courseId });
        if (!student.courses.includes(courseId)) {
          student.courses.push(courseId);
          await student.save();
        }
        return student;
      } catch (err) {
        throw new Error("Failed to create enrollment");
      }
    },
    //unenroll student
    unenrollStudent: async (_, { studentId, courseId }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");

      const student = await Student.findById(studentId);
      if (!student) throw new Error("Student not found");

      const course = await Course.findById(courseId);
      if (!course) throw new Error("Course not found");

      const existing = await Enrollment.findOne({ studentId, courseId });
      if (!existing) throw new Error("Student not enrolled in this course");

      try {
        await Enrollment.deleteOne({ studentId, courseId });
        student.courses = student.courses.filter(
          (id) => id.toString() !== courseId
        );
        await student.save();
        return student;
      } catch (err) {
        throw new Error("Failed to delete enrollment");
      }
    },
  },

  //Implement Nested Resolvers
  Student: {
    courses: async (parent) => {
      return await Course.find({ _id: { $in: parent.courses } });
    },
  },

  Course: {
    students: async (parent) => {
      // parent = course object
      const enrollments = await Enrollment.find({
        courseId: parent._id,
      }).populate("studentId");
      return enrollments.map((e) => e.studentId);
    },
  },
};

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
