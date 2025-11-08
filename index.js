import { ApolloServer, gql } from "apollo-server-express";
import express from "express";
import Course from "./models/Course.js";
import Student from "./models/Student.js";
import mongoose from "mongoose";
import Enrollment from "./models/Enrollment.js";

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

  type Mutation {
    createStudent(input: CreateStudentInput!): Student!
    deleteStudent(id: ID!): Student
    updateStudent(id: ID!, input: UpdateStudentInput!): Student!

    createCourse(input: CreateCourseInput!): Course!
    deleteCourse(id: ID!): Course!
    updateCourse(id: ID!, input: UpdateCourseInput!): Course!

    enrollStudent(studentId: ID!, courseId: ID!): Enrollment!
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
    //create student
    createStudent: async (_, { input }) => {
      try {
        const student = await Student.create(input);
        return student;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to create student");
      }
    },
    //delete student
    deleteStudent: async (_, { id }) => {
      try {
        const student = await Student.findOneAndDelete({ _id: id });
        return student;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to create student");
      }
    },
    //update Students
    updateStudent: async (_, { id, input }) => {
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
    createCourse: async (_, { input }) => {
      try {
        const course = await Course.create(input);
        return course;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to create course");
      }
    },
    //delete course
    deleteCourse: async (_, { id }) => {
      try {
        const course = await Course.findOneAndDelete({ _id: id });
        return course;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to delete student");
      }
    },
    //update course
    updateCourse: async (_, { id, input }) => {
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
    enrollStudent: async (_, { studentId, courseId }) => {
      try {
        const enrollment = await Enrollment.create({ studentId, courseId });
        return enrollment;
      } catch (err) {
        console.log(err);
        throw new Error("Failed to create enrollment");
      }
    },
  },

  //Implement Nested Resolvers
  Student: {
    courses: async (parent) => {
      const enrollments = await Enrollment.find({
        studentId: parent._id,
      }).populate("courseId");
      return enrollments.map((e) => e.courseId);
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

async function start() {
  const app = express();
  //graphql & apollo
  const server = new ApolloServer({
    typeDefs,
    resolvers,
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
