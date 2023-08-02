
const emailRegex = /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/;
const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const mobileRegex = /^[1-9]\d{9}$/

const objectId = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{24}$/)) {
    return helpers.message('"{{#label}}" must be a valid mongo id');
  }
  return value;
};


const isValidBody = (value) => {
  return Object.keys(value).length > 0
}

const isValid = (value) => {
  if (typeof value === "undefined" || value == null) return false
  if (typeof value === "string" && value.trim().length === 0) return false
  return true
}

const isValidField = (value) => {
  if (typeof value === "string" && value.trim().length === 0) return false
  return true
}

module.exports = { nameRegex, emailRegex, passwordRegex, mobileRegex, objectId, isValidBody, isValid, isValidField }