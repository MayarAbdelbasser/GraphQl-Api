import { gql } from "apollo-server-express";

const typeDefs = gql`
  type Student {
    id: ID
    name: String!
    email: String!
    age: Int!
    major: String!
    courses: [Course!]
    coursesCount: Int!
  }
  type Course {
    id: ID!
    title: String!
    credits: Int!
    instructor: String!
    code: String!
    students: [Student!]
    studentsCount: Int!
  }
  type Enrollment {
    id: ID!
    studentId: ID!
    courseId: ID!
  }
  type Query {
    getAllStudents(filter: StudentFilter, options: ListOptions): [Student!]!
    getStudentById(id: ID!): Student
    getAllCourses(filter: CourseFilter, options: ListOptions): [Course!]!
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

  input StudentFilter {
    major: String
    nameContains: String
    emailContains: String
    minAge: Int
    maxAge: Int
  }

  input CourseFilter {
    codePrefix: String
    titleContains: String
    instructor: String
    minCredits: Int
    maxCredits: Int
  }

  input ListOptions {
    limit: Int
    offset: Int
    sortBy: String
    sortOrder: String
  }
`;
export default typeDefs;
