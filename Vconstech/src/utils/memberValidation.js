export const isValidPhone = (v) => /^\d{10}$/.test(v.trim());

export const isValidEmail = (v) =>
  /^[^\s@]+@gmail\.com$/i.test(v.trim());

export const isValidName = (v) =>
  v.trim().length >= 2;

export function validateMember(form, image, existingMembers = [], existingImageUrl = "") {
  const errors = {};

  if (!isValidName(form.name)) {
    errors.name = "Full name is required (min 2 chars).";
  }

  if (!form.phone) {
    errors.phone = "Phone number is required.";
  } else if (!isValidPhone(form.phone)) {
    errors.phone = "Phone must be exactly 10 digits.";
  } else if (
    existingMembers.some((m) => m.phone === form.phone.trim())
  ) {
    errors.phone = "This phone number is already registered.";
  }

  if (!form.email) {
    errors.email = "Email address is required.";
  } else if (!isValidEmail(form.email)) {
    errors.email = "Email must be a valid @gmail.com address.";
  } else if (
    existingMembers.some(
      (m) => m.email.toLowerCase() === form.email.trim().toLowerCase()
    )
  ) {
    errors.email = "This email is already registered.";
  }

  if (!form.department) {
    errors.department = "Please select a department.";
  }

  if (!form.role.trim()) {
    errors.role = "Role is required.";
  }

  if (!form.designation.trim()) {
    errors.designation = "Designation is required.";
  }

  if (!form.dateJoined) {
    errors.dateJoined = "Date of joining is required.";
  }

  // ← only error if no new file AND no existing saved photo
  if (!image && !existingImageUrl) {
    errors.image = "Profile image is required.";
  }

  return errors;
}