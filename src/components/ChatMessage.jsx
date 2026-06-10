import { URGENCY } from "../lib/guardrails";
import styles from "./ChatMessage.module.css";

/**
 * ChatMessage
 *
 * Renders a single message bubble with a guardrail badge for bot responses.
 * The urgency prop controls the visual treatment (urgent = red, safe = green).
 */
export function ChatMessage({ message }) {
  const { role, text, urgency } = message;
  const isBot = role === "assistant";

  return (
    <div className={`${styles.wrapper} ${isBot ? styles.bot : styles.user}`}>
      <div className={styles.avatar}>{isBot ? "HC" : "You"}</div>

      <div
        className={`${styles.bubble} ${
          urgency === URGENCY.URGENT ? styles.urgent : ""
        }`}
      >
        <p>{text}</p>

        {isBot && urgency && (
          <span
            className={`${styles.badge} ${
              urgency === URGENCY.URGENT ? styles.badgeUrgent : styles.badgeSafe
            }`}
          >
            {urgency === URGENCY.URGENT
              ? "⚠ Escalation triggered"
              : "✓ Guardrail: safe"}
          </span>
        )}
      </div>
    </div>
  );
}
