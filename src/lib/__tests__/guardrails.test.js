import { describe, it, expect } from "vitest";
import { parseGuardrail, URGENCY } from "../guardrails.js";

/**
 * guardrails.test.js
 *
 * Pure unit tests — no API calls, no mocks needed.
 * parseGuardrail is a plain function so every case is fast and deterministic.
 */

describe("parseGuardrail", () => {
  // --- URGENT cases ---

  it("detects [URGENT] prefix and returns URGENT urgency", () => {
    const result = parseGuardrail("[URGENT] Please call 911 immediately.");
    expect(result.urgency).toBe(URGENCY.URGENT);
  });

  it("strips the [URGENT] tag from the returned text", () => {
    const result = parseGuardrail("[URGENT] Please call 911 immediately.");
    expect(result.text).toBe("Please call 911 immediately.");
  });

  it("strips [URGENT] with extra whitespace after the tag", () => {
    const result = parseGuardrail("[URGENT]   Go to the ER now.");
    expect(result.text).toBe("Go to the ER now.");
  });

  // --- SAFE cases ---

  it("detects [SAFE] prefix and returns SAFE urgency", () => {
    const result = parseGuardrail("[SAFE] That sounds normal, keep resting.");
    expect(result.urgency).toBe(URGENCY.SAFE);
  });

  it("strips the [SAFE] tag from the returned text", () => {
    const result = parseGuardrail("[SAFE] That sounds normal, keep resting.");
    expect(result.text).toBe("That sounds normal, keep resting.");
  });

  it("strips [SAFE] with extra whitespace after the tag", () => {
    const result = parseGuardrail("[SAFE]   Drink plenty of fluids.");
    expect(result.text).toBe("Drink plenty of fluids.");
  });

  // --- UNKNOWN fallback ---

  it("returns UNKNOWN when no tag is present", () => {
    const result = parseGuardrail("How are you feeling today?");
    expect(result.urgency).toBe(URGENCY.UNKNOWN);
  });

  it("returns the full text unchanged when no tag is present", () => {
    const result = parseGuardrail("How are you feeling today?");
    expect(result.text).toBe("How are you feeling today?");
  });

  it("returns UNKNOWN when tag appears mid-sentence rather than as a prefix", () => {
    const result = parseGuardrail("The system says [URGENT] but this is mid-text.");
    expect(result.urgency).toBe(URGENCY.UNKNOWN);
  });

  it("returns UNKNOWN for an empty string", () => {
    const result = parseGuardrail("");
    expect(result.urgency).toBe(URGENCY.UNKNOWN);
    expect(result.text).toBe("");
  });

  // --- Edge cases ---

  it("does not match lowercase [urgent] tag", () => {
    const result = parseGuardrail("[urgent] call 911");
    expect(result.urgency).toBe(URGENCY.UNKNOWN);
  });

  it("does not match lowercase [safe] tag", () => {
    const result = parseGuardrail("[safe] you're fine");
    expect(result.urgency).toBe(URGENCY.UNKNOWN);
  });

  it("handles a response that is only the [URGENT] tag with no message", () => {
    const result = parseGuardrail("[URGENT]");
    expect(result.urgency).toBe(URGENCY.URGENT);
    expect(result.text).toBe("");
  });

  it("handles a response that is only the [SAFE] tag with no message", () => {
    const result = parseGuardrail("[SAFE]");
    expect(result.urgency).toBe(URGENCY.SAFE);
    expect(result.text).toBe("");
  });
});
