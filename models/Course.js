import mongoose, { Schema } from "mongoose";
const courseSchema = new Schema({
  title: { type: String, required: true },
  code: { type: String, required: true },
  credits: { type: Number, required: true },
  instructor: { type: String, required: true },
});

const Course = mongoose.model("Course", courseSchema);
export default Course;
