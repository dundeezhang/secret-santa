const { Resend } = require("resend");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Initialize Resend client
 */
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY environment variable is not set. Please add it to your .env file.",
    );
  }

  return new Resend(apiKey);
}

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
 * Sends Secret Santa assignment email to a participant
 */
async function sendSecretSantaEmail(santa, receiver, fromEmail) {
  const resend = getResendClient();

  try {
    const htmlContent = getEmailTemplate(santa.name, receiver.name);
    const textContent = getTextFromHtml(htmlContent);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: santa.email,
      subject: "Group Secret Santa Assignment",
      html: htmlContent,
      text: textContent,
    });

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sends Secret Santa emails to all participants
 */
async function sendAllEmails(pairings, fromEmail) {
  if (!fromEmail) {
    throw new Error(
      "FROM_EMAIL environment variable is not set. Please add it to your .env file.",
    );
  }

  console.log("\n📧 Sending Secret Santa emails...\n");

  const results = [];

  for (const pairing of pairings) {
    process.stdout.write(
      `   Sending to ${pairing.santa.name} (${pairing.santa.email})... `,
    );

    const result = await sendSecretSantaEmail(
      pairing.santa,
      pairing.receiver,
      fromEmail,
    );

    results.push({
      santa: pairing.santa.name,
      ...result,
    });

    if (result.success) {
      console.log("✅ Sent!");
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }

    // Delay to avoid rate limiting (Resend free tier: 2 requests/second)
    await new Promise((resolve) => setTimeout(resolve, 600));
  }

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("\n" + "=".repeat(50));
  console.log(`📊 Email Summary:`);
  console.log(`   ✅ Sent: ${successful}/${pairings.length}`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed}/${pairings.length}`);
  }
  console.log("=".repeat(50));

  return results;
}

module.exports = {
  sendSecretSantaEmail,
  sendAllEmails,
};
