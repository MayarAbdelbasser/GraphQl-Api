import mongoose, { Schema } from "mongoose";
const EnrollmentSchema = new Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
});

const Enrollment = mongoose.model("Enrollment", EnrollmentSchema);
export default Enrollment;
