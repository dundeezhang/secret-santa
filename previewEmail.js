const fs = require("fs");
const path = require("path");

/**
 * Reads and processes the email template
 */
function getEmailTemplate(santaName, receiverName) {
  const templatePath = path.join(__dirname, "email.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  return template
    .replace(/{{SANTA_NAME}}/g, santaName)
    .replace(/{{RECEIVER_NAME}}/g, receiverName);
}

/**
 * Extracts plain text from HTML body
 */
function getTextFromHtml(html) {
  // Extract body content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return "";

  let text = bodyMatch[1];

  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, "");

  // Decode common HTML entities
  text = text.replace(/&nbsp;/g, " ");
  text = text.replace(/&amp;/g, "&");
  text = text.replace(/&lt;/g, "<");
  text = text.replace(/&gt;/g, ">");
  text = text.replace(/&quot;/g, '"');

  // Clean up whitespace
  text = text.replace(/[ \t]+/g, " "); // Multiple spaces/tabs to single space
  text = text.replace(/\n\s*/g, "\n"); // Remove indentation
  text = text.replace(/\n\n+/g, "\n\n"); // Multiple newlines to double
  text = text.trim();

  return text;
}

/**
 * Generates a preview of the Secret Santa email
 * Useful for testing the email template without sending
 */
function generateEmailPreview() {
  const santa = { name: "Dundee", email: "dundee@example.com" };
  const receiver = { name: "John", email: "john@example.com" };

  const html = getEmailTemplate(santa.name, receiver.name);
  const text = getTextFromHtml(html);

  // Save HTML preview
  fs.writeFileSync("email-preview.html", html);
  console.log("Email preview saved to email-preview.html");
  console.log("   Open this file in your browser to preview email\n");

  // Display text version
  console.log("Text version of email:");
  console.log("=".repeat(60));
  console.log(text);
  console.log("=".repeat(60));
}

// Run if called directly
if (require.main === module) {
  console.log("Generating Secret Santa email preview\n");
  generateEmailPreview();
}

module.exports = { generateEmailPreview };
