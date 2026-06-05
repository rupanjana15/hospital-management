/**
 * File Handler Utility
 * Provides functions for reading and writing JSON files safely
 */

const fs = require("fs").promises;
const path = require("path");

/**
 * Read and parse a JSON file
 * @param {string} filePath - Absolute path to the JSON file
 * @returns {Promise<any>} Parsed JSON data
 */
async function readJSONFile(filePath) {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File doesn't exist, return empty array
      return [];
    }
    throw new Error(`Failed to read JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Write data to a JSON file atomically
 * Uses a temporary file and rename to ensure atomic writes
 * @param {string} filePath - Absolute path to the JSON file
 * @param {any} data - Data to write (will be JSON.stringified)
 * @returns {Promise<void>}
 */
async function writeJSONFile(filePath, data) {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const tempPath = `${filePath}.tmp`;

    // Write to temporary file first
    await fs.writeFile(tempPath, jsonString, "utf8");

    // Atomically rename temp file to target file
    await fs.rename(tempPath, filePath);
  } catch (error) {
    throw new Error(`Failed to write JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Ensure a directory exists, create if it doesn't
 * @param {string} dirPath - Directory path
 * @returns {Promise<void>}
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
}

module.exports = {
  readJSONFile,
  writeJSONFile,
  ensureDirectoryExists,
};
