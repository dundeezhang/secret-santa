const fs = require("fs");
const { sendAllEmails } = require("./emailService");
require("dotenv").config();

/**
 * Reads names and emails from names.txt
 * Expected format: "name email" on each line
 */
function readParticipants(filename = "names.txt") {
  try {
    const content = fs.readFileSync(filename, "utf-8");
    const lines = content.trim().split("\n");

    return lines
      .map((line) => {
        const [name, email] = line.trim().split(/\s+/);
        return { name, email };
      })
      .filter((p) => p.name && p.email);
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    process.exit(1);
  }
}

/**
 * Checks if a matching is valid (no one gives to themselves, no mutual pairs)
 */
function isValidMatching(santas, receivers) {
  for (let i = 0; i < santas.length; i++) {
    // Check if someone is their own Santa
    if (santas[i] === receivers[i]) {
      return false;
    }

    // Check for mutual pairs (A->B and B->A)
    const santa = santas[i];
    const receiver = receivers[i];

    for (let j = 0; j < santas.length; j++) {
      if (i !== j && santas[j] === receiver && receivers[j] === santa) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Generates a valid Secret Santa matching
 * Uses a derangement algorithm to ensure no one is their own Santa
 * and no two people exchange gifts
 */
function generateMatching(participants) {
  if (participants.length < 3) {
    throw new Error("Need at least 3 participants for Secret Santa");
  }

  const maxAttempts = 1000;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;

    // Create a shuffled copy of participants as receivers
    const receivers = [...participants];

    // Fisher-Yates shuffle
    for (let i = receivers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [receivers[i], receivers[j]] = [receivers[j], receivers[i]];
    }

    // Check if this matching is valid
    if (isValidMatching(participants, receivers)) {
      return participants.map((santa, i) => ({
        santa,
        receiver: receivers[i],
      }));
    }
  }

  throw new Error("Failed to generate valid matching after maximum attempts");
}

/**
 * Writes the Secret Santa pairings to output.txt
 */
function writePairings(pairings, filename = "output.txt") {
  try {
    const output = pairings
      .map((pair) => `${pair.santa.name}: ${pair.receiver.name}`)
      .join("\n");

    fs.writeFileSync(filename, output + "\n", "utf-8");
    console.log(`Secret Santa pairings written to ${filename}`);
    console.log(`Generated ${pairings.length} pairings`);
  } catch (error) {
    console.error(`Error writing ${filename}:`, error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
async function main() {
  console.log("Secret Santa Matcher\n");

  // Read participants
  const participants = readParticipants("names.txt");

  if (participants.length === 0) {
    console.error("No valid participants found in names.txt");
    process.exit(1);
  }

  console.log(`Found ${participants.length} participants:`);
  participants.forEach((p) => console.log(`   - ${p.name} (${p.email})`));
  console.log();

  // Generate matching
  const pairings = generateMatching(participants);

  // Write output
  writePairings(pairings, "output.txt");

  console.log("\nEach person has been assigned a unique receiver.");

  // Send emails if configured
  const sendEmails = process.env.SEND_EMAILS !== "false";
  const fromEmail = process.env.FROM_EMAIL;

  if (sendEmails) {
    if (!fromEmail) {
      console.log("\nFROM_EMAIL not configured in .env file");
      console.log(
        "   Skipping email sending. Set FROM_EMAIL and RESEND_API_KEY to enable emails.",
      );
    } else if (!process.env.RESEND_API_KEY) {
      console.log("\nRESEND_API_KEY not configured in .env file");
      console.log(
        "Skipping email sending. Set RESEND_API_KEY to enable emails.",
      );
    } else {
      try {
        await sendAllEmails(pairings, fromEmail);
        console.log("\nAll Secret Santa emails have been sent!");
      } catch (error) {
        console.error("\nError sending emails:", error.message);
        console.error("Pairings have been saved to output.txt");
      }
    }
  } else {
    console.log("\nEmail sending disabled (SEND_EMAILS=false)");
  }
}

// Run the program
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}

// Export functions for potential future use with Resend
module.exports = {
  readParticipants,
  generateMatching,
  writePairings,
};
