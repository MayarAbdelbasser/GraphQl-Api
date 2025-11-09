import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import Student from "../models/Student.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "my-top-secret";

const resolvers = {
  Query: {
    //get all students
    getAllStudents: async (_, { filter = {}, options = {} }) => {
      const {
        limit = 10,
        offset = 0,
        sortBy = "name",
        sortOrder = "ASC",
      } = options;

      const ALLOWED_STUDENT_SORT = ["name", "age", "email", "major"];

      const sortField = ALLOWED_STUDENT_SORT.includes(sortBy) ? sortBy : "name";

      const { major, nameContains, emailContains, minAge, maxAge } = filter;

      let query = {};
      if (major) query.major = major;
      if (nameContains) query.name = { $regex: nameContains, $options: "i" };
      if (emailContains) query.email = { $regex: emailContains, $options: "i" };
      if (minAge) query.age = { ...query.age, $gte: minAge };
      if (maxAge) query.age = { ...query.age, $lte: maxAge };

      let studentsQuery = Student.find(query)
        .sort({ [sortField]: sortOrder === "DESC" ? -1 : 1 })
        .skip(offset)
        .limit(Math.min(limit, 50));
      return await studentsQuery;
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

    getAllCourses: async (_, { filter = {}, options = {} }) => {
      const { codePrefix, titleContains, instructor, minCredits, maxCredits } =
        filter;
      const {
        limit = 10,
        offset = 0,
        sortBy = "title",
        sortOrder = "ASC",
      } = options;

      let query = {};
      if (codePrefix) query.code = { $regex: `^${codePrefix}`, $options: "i" };
      if (titleContains) query.title = { $regex: titleContains, $options: "i" };
      if (instructor) query.instructor = { $regex: instructor, $options: "i" };
      if (minCredits) query.credits = { ...query.credits, $gte: minCredits };
      if (maxCredits) query.credits = { ...query.credits, $lte: maxCredits };

      return await Course.find(query)
        .sort({ [sortBy]: sortOrder === "DESC" ? -1 : 1 })
        .skip(offset)
        .limit(Math.min(limit, 50));
    },
    getCourseById: async (_, { id }) => {
      try {
        return await Course.findById(id);
      } catch (err) {
        throw new Error(err);
      }
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

      const { name, email, age, major } = input;
      // email-ish
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) throw new Error("Invalid email format");
      if (age < 16) throw new Error("Student must be at least 16 years old");

      // case-insensitive uniqueness
      const exists = await Student.findOne({
        email: { $regex: `^${email}$`, $options: "i" },
      });
      if (exists) throw new Error("Email already in use");

      const student = await Student.create({ name, email, age, major });
      return student;
    },
    //delete student
    deleteStudent: async (_, { id }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      try {
        const student = await Student.findOneAndDelete({ _id: id });
        if (student) {
          await Enrollment.deleteMany({ studentId: id });
        }
        return student;
      } catch (err) {
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
      const { title, code, credits, instructor } = input;
      if (!code) throw new Error("Course code required");
      if (credits < 1 || credits > 6)
        throw new Error("Credits must be between 1 and 6");
      const exists = await Course.findOne({
        code: { $regex: `^${code}$`, $options: "i" },
      });
      if (exists) throw new Error("Course code already exists");
      const course = await Course.create({ title, code, credits, instructor });
      return course;
    },

    //delete course
    deleteCourse: async (_, { id }, { user }) => {
      if (!user) throw new Error("UNAUTHENTICATED");
      try {
        const course = await Course.findOneAndDelete({ _id: id });
        if (course) {
          await Enrollment.deleteMany({ courseId: id });
        }
        return course;
      } catch (err) {
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
        return student;
      } catch (err) {
        throw new Error("Failed to delete enrollment");
      }
    },
  },

  //Implement Nested Resolvers
  Student: {
    courses: async (parent) => {
      const enrolls = await Enrollment.find({ studentId: parent._id });
      const courseIds = enrolls.map((e) => e.courseId);
      return Course.find({ _id: { $in: courseIds } });
    },
    coursesCount: async (parent) => {
      return Enrollment.countDocuments({ studentId: parent._id });
    },
  },

  Course: {
    students: async (parent) => {
      const enrollments = await Enrollment.find({
        courseId: parent._id,
      }).populate("studentId");
      return enrollments.map((e) => e.studentId);
    },
    studentsCount: async (parent) => {
      const count = await Enrollment.countDocuments({ courseId: parent._id });
      return count;
    },
  },
};
export default resolvers;
