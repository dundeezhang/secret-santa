const fs = require("fs");

/**
 * Verifies that a Secret Santa matching is valid
 */
function verifyMatching(filename = "output.txt") {
  try {
    const content = fs.readFileSync(filename, "utf-8");
    const lines = content.trim().split("\n");

    const pairings = lines.map((line) => {
      const [santa, receiver] = line.split(":").map((s) => s.trim());
      return { santa, receiver };
    });

    console.log("🔍 Verifying Secret Santa matching...\n");

    let isValid = true;
    const errors = [];

    // Check 1: Everyone appears as santa exactly once
    const santas = pairings.map((p) => p.santa);
    const santaSet = new Set(santas);
    if (santas.length !== santaSet.size) {
      errors.push("❌ Some people are santas more than once");
      isValid = false;
    } else {
      console.log("✅ Each person is a santa exactly once");
    }

    // Check 2: Everyone appears as receiver exactly once
    const receivers = pairings.map((p) => p.receiver);
    const receiverSet = new Set(receivers);
    if (receivers.length !== receiverSet.size) {
      errors.push("❌ Some people are receivers more than once");
      isValid = false;
    } else {
      console.log("✅ Each person is a receiver exactly once");
    }

    // Check 3: No one gives to themselves
    const selfGifts = pairings.filter((p) => p.santa === p.receiver);
    if (selfGifts.length > 0) {
      errors.push(
        `❌ Self-gifting found: ${selfGifts.map((p) => p.santa).join(", ")}`,
      );
      isValid = false;
    } else {
      console.log("✅ No one gives to themselves");
    }

    // Check 4: No mutual exchanges (A->B and B->A)
    const mutualPairs = [];
    for (let i = 0; i < pairings.length; i++) {
      for (let j = i + 1; j < pairings.length; j++) {
        const p1 = pairings[i];
        const p2 = pairings[j];

        if (p1.santa === p2.receiver && p1.receiver === p2.santa) {
          mutualPairs.push(`${p1.santa} ↔ ${p1.receiver}`);
          isValid = false;
        }
      }
    }

    if (mutualPairs.length > 0) {
      errors.push(`❌ Mutual exchanges found: ${mutualPairs.join(", ")}`);
    } else {
      console.log("✅ No mutual gift exchanges");
    }

    // Check 5: Everyone who gives also receives and vice versa
    const allParticipants = new Set([...santas, ...receivers]);
    if (
      santaSet.size === receiverSet.size &&
      [...santaSet].every((s) => receiverSet.has(s)) &&
      [...receiverSet].every((r) => santaSet.has(r))
    ) {
      console.log("✅ All participants give and receive");
    } else {
      errors.push("❌ Mismatch between givers and receivers");
      isValid = false;
    }

    console.log("\n" + "=".repeat(50));

    if (isValid) {
      console.log("🎉 VALID MATCHING! All checks passed.");
      console.log(`   Total participants: ${pairings.length}`);
    } else {
      console.log("⚠️  INVALID MATCHING! Issues found:");
      errors.forEach((err) => console.log(`   ${err}`));
    }

    console.log("=".repeat(50) + "\n");

    return isValid;
  } catch (error) {
    console.error(`Error reading ${filename}:`, error.message);
    process.exit(1);
  }
}

// Run verification
verifyMatching();
