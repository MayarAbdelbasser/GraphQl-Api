import mongoose, { Schema } from "mongoose";

const studentSchema = new Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  age: { type: Number, required: true },
  major: { type: String, required: true },
});
const Student = mongoose.model("Student", studentSchema);

export default Student;
