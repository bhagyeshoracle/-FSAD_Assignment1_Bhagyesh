const classes = {
  PENDING: "badge pending",
  APPROVED: "badge approved",
  REJECTED: "badge rejected",
  RETURNED: "badge returned",
};

export function StatusBadge({ value }) {
  const normalized = String(value || "").toUpperCase();
  return <span className={classes[normalized] || "badge"}>{normalized || "UNKNOWN"}</span>;
}
