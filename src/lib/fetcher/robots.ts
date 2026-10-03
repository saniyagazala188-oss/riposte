// A small robots.txt reader: Riposte skips any page a website asks bots not to visit.

export type Robots = { allow: string[]; disallow: string[] };

export function parseRobots(body: string, agent = "ripostebot"): Robots {
  const groups: { agents: string[]; allow: string[]; disallow: string[] }[] = [];
  let current: (typeof groups)[number] | null = null;
  let lastWasAgent = false;

  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], allow: [], disallow: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === "allow" && value) current.allow.push(value);
    if (key === "disallow" && value) current.disallow.push(value);
  }

  const specific = groups.filter((g) => g.agents.some((a) => a !== "*" && agent.includes(a)));
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes("*"));
  return {
    allow: chosen.flatMap((g) => g.allow),
    disallow: chosen.flatMap((g) => g.disallow),
  };
}

function matchLength(rule: string, path: string): number {
  const anchored = rule.endsWith("$");
  const pattern = rule
    .replace(/\$$/, "")
    .replace(/[.+?^{}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  const re = new RegExp(`^${pattern}${anchored ? "$" : ""}`);
  return re.test(path) ? rule.length : -1;
}

// The longest matching rule wins; on a tie, Allow wins.
export function isAllowed(robots: Robots, path: string): boolean {
  const allow = Math.max(-1, ...robots.allow.map((r) => matchLength(r, path)));
  const disallow = Math.max(-1, ...robots.disallow.map((r) => matchLength(r, path)));
  return disallow < 0 || allow >= disallow;
}
