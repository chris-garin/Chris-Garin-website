const toggle = document.getElementById("mobile-menu");
const nav = document.getElementById("primary-nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    toggle.classList.toggle("is-active");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}

const fields = {
  founderProfile: document.getElementById("founderProfile"),
  founderConstraints: document.getElementById("founderConstraints"),
  ideaSummary: document.getElementById("ideaSummary"),
  audienceProblem: document.getElementById("audienceProblem"),
  whyNow: document.getElementById("whyNow"),
  unknowns: document.getElementById("unknowns"),
  firstTest: document.getElementById("firstTest"),
};

const promptOutput = document.getElementById("promptOutput");
const copyPromptButton = document.getElementById("copyPromptButton");
const copyFeedback = document.getElementById("copyFeedback");
const loginForm = document.getElementById("login-form");
const loginState = document.getElementById("login-state");
const loginStateName = document.getElementById("login-state-name");
const logoutButton = document.getElementById("logout-button");
const workspace = document.getElementById("idea-workspace");
const loginName = document.getElementById("login-name");
const loginEmail = document.getElementById("login-email");

const scoreElements = {
  founderFit: document.querySelector('[data-score-value="founderFit"]'),
  defensibility: document.querySelector('[data-score-value="defensibility"]'),
  capitalFit: document.querySelector('[data-score-value="capitalFit"]'),
  riskReward: document.querySelector('[data-score-value="riskReward"]'),
  validationSpeed: document.querySelector('[data-score-value="validationSpeed"]'),
  priority: document.querySelector('[data-score-value="priority"]'),
};

const noteElements = {
  founderFit: document.getElementById("founderFitNote"),
  defensibility: document.getElementById("defensibilityNote"),
  capitalFit: document.getElementById("capitalFitNote"),
  riskReward: document.getElementById("riskRewardNote"),
  validationSpeed: document.getElementById("validationSpeedNote"),
  priority: document.getElementById("priorityNote"),
};

const defaultValues = {
  founderProfile:
    "I have a business-content audience, strong storytelling and sales instincts, and relationships in entrepreneurship, marketing, and local service businesses.",
  founderConstraints:
    "I prefer ideas that can start lean, fit a creator-led lifestyle, and do not require huge capital before I can validate demand.",
  ideaSummary:
    "A personal AI idea vault that helps founders turn rough ideas into ranked opportunities based on founder fit, feasibility, defensibility, and upside.",
  audienceProblem:
    "It is for people with many business ideas who feel stuck, cannot tell which idea is worth their time, and want a consistent way to decide what to test next.",
  whyNow:
    "I already have this problem myself. I also have content and a worldview around idea quality, unfair advantage, and choosing the right business to pursue.",
  unknowns:
    "I am not yet sure which audience segment will pay first, what the strongest moat becomes over time, and whether the first version should just be a prompt workflow or a full app.",
  firstTest:
    "Publish the concept on my site, show people a free Gemini-powered version, and measure whether they actually submit ideas and ask for deeper evaluation.",
};

Object.entries(fields).forEach(([key, element]) => {
  if (element && !element.value) {
    element.value = defaultValues[key];
  }
});

const STORAGE_KEY = "chrisgarin.ideaValidation.user";

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getText(id) {
  return fields[id]?.value.trim() || "";
}

function wordCount(text) {
  return text ? text.split(/\s+/).filter(Boolean).length : 0;
}

function hasAny(text, keywords) {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
}

function scoreIdea() {
  const founderProfile = getText("founderProfile");
  const founderConstraints = getText("founderConstraints");
  const ideaSummary = getText("ideaSummary");
  const audienceProblem = getText("audienceProblem");
  const whyNow = getText("whyNow");
  const unknowns = getText("unknowns");
  const firstTest = getText("firstTest");

  const allText = [
    founderProfile,
    founderConstraints,
    ideaSummary,
    audienceProblem,
    whyNow,
    unknowns,
    firstTest,
  ].join(" ");

  const clarityBoost = clamp(wordCount(ideaSummary) / 40, 0, 1.1);
  const founderBoost =
    (hasAny(founderProfile, ["audience", "network", "experience", "sales", "content", "brand", "distribution"]) ? 1.2 : 0) +
    (hasAny(whyNow, ["i", "my", "experience", "audience", "know", "background"]) ? 0.8 : 0);
  const moatBoost =
    (hasAny(allText, ["audience", "distribution", "brand", "community", "data", "network effect", "supply", "trust", "content"]) ? 1.4 : 0);
  const capitalPenalty = hasAny(allText, ["expensive", "capital intensive", "inventory", "warehouse", "raise money", "team of engineers"]) ? 1.2 : 0;
  const capitalBoost = hasAny(founderConstraints, ["lean", "start lean", "validate", "small team", "low overhead"]) ? 1.1 : 0;
  const rewardBoost = hasAny(allText, ["marketplace", "software", "saas", "media", "audience", "platform", "recurring"]) ? 1.2 : 0;
  const validationBoost = hasAny(firstTest, ["interview", "presell", "landing page", "outreach", "content", "waitlist", "call"]) ? 1.4 : 0;
  const uncertaintyPenalty = clamp(wordCount(unknowns) / 60, 0, 1.2);

  const founderFit = clamp(4.6 + clarityBoost + founderBoost - uncertaintyPenalty * 0.35, 1, 10);
  const defensibility = clamp(4.2 + moatBoost + clarityBoost * 0.45 - uncertaintyPenalty * 0.4, 1, 10);
  const capitalFit = clamp(4.8 + capitalBoost - capitalPenalty + clarityBoost * 0.3, 1, 10);
  const riskReward = clamp(5 + rewardBoost + moatBoost * 0.35 - capitalPenalty * 0.3, 1, 10);
  const validationSpeed = clamp(4.7 + validationBoost + clarityBoost * 0.25 - capitalPenalty * 0.2, 1, 10);

  const priority = clamp(
    founderFit * 0.22 +
      defensibility * 0.18 +
      capitalFit * 0.16 +
      riskReward * 0.24 +
      validationSpeed * 0.2,
    1,
    10
  );

  return {
    founderFit,
    defensibility,
    capitalFit,
    riskReward,
    validationSpeed,
    priority,
    founderProfile,
    founderConstraints,
    ideaSummary,
    audienceProblem,
    whyNow,
    unknowns,
    firstTest,
  };
}

function getScoreNote(type, score, data) {
  const notes = {
    founderFit:
      score >= 7
        ? "This appears aligned with your strengths, identity, and natural advantages."
        : "Founder fit is still forming. Add more about your edge, interests, and relevant experience.",
    defensibility:
      score >= 7
        ? "There are early signs of a moat through distribution, trust, content, supply, or audience."
        : "The moat is still weak or implied. AI should suggest ways this becomes hard to copy over time.",
    capitalFit:
      score >= 7
        ? "This looks testable without overwhelming upfront capital pressure."
        : "The capital picture is unclear. AI should estimate whether this can be validated lean or needs heavier resources.",
    riskReward:
      score >= 7
        ? "The upside looks meaningful relative to the likely effort and downside."
        : "The reward may be interesting, but the path is not yet strong enough to justify the risk confidently.",
    validationSpeed:
      score >= 7
        ? "You already have the bones of a fast first test."
        : "The first validation step needs to be smaller, faster, and more concrete.",
    priority:
      score >= 7
        ? "This is starting to look like a strong candidate to pursue or test aggressively."
        : "Promising, but not clear enough yet to outrank stronger, more validated ideas.",
  };

  if (type === "priority" && !data.ideaSummary) {
    return "Start by describing the rough idea so the tool has something real to score.";
  }

  return notes[type];
}

function buildPrompt(data) {
  const decisionBand =
    data.priority >= 7.5
      ? "High-priority candidate"
      : data.priority >= 6
        ? "Worth testing soon"
        : "Interesting, but still uncertain";

  return `You are my personal idea validation strategist.

Your job is to take my rough business idea, combine it with my founder context, fill in missing possibilities where appropriate, and help me decide whether this idea deserves my time, capital, and focus.

Important instructions:
- Do not act like a cheerleader.
- Be thoughtful, sharp, and honest.
- Distinguish clearly between what is directly supported by my input and what you are inferring.
- If I am unsure about something, suggest plausible possibilities instead of pretending certainty.
- Suggest a moat if one is not obvious.
- Tell me what must be true for this to work.
- Tell me whether this is worth pursuing now, testing first, parking, or dropping.
- Keep the analysis practical and founder-specific.

Founder context:
${data.founderProfile || "[Not provided yet]"}

Founder goals, capital, and constraints:
${data.founderConstraints || "[Not provided yet]"}

Idea:
${data.ideaSummary || "[Not provided yet]"}

Target customer and problem:
${data.audienceProblem || "[Not provided yet]"}

Why I am interested / why this might work:
${data.whyNow || "[Not provided yet]"}

Known doubts or unknowns:
${data.unknowns || "[Not provided yet]"}

My first test idea:
${data.firstTest || "[Not provided yet]"}

Early-stage tool snapshot:
- Founder Fit: ${data.founderFit.toFixed(1)}/10
- Defensibility: ${data.defensibility.toFixed(1)}/10
- Capital Fit: ${data.capitalFit.toFixed(1)}/10
- Risk / Reward: ${data.riskReward.toFixed(1)}/10
- Validation Speed: ${data.validationSpeed.toFixed(1)}/10
- Priority Score: ${data.priority.toFixed(1)}/10
- Current read: ${decisionBand}

Return the analysis in this exact structure:

1. Idea Expansion
- Rewrite the idea into a clearer business concept.
- Suggest the most plausible customer, offer, and business model.

2. What Must Be True
- List the 3 to 5 conditions that must be true for this to become a no-brainer.

3. Main Challenges
- Explain the biggest practical, strategic, or market challenges.

4. Founder Fit
- Explain whether this matches my strengths, interests, network, lifestyle goals, and unfair advantages.
- If there is misalignment, say so clearly.

5. Defensibility / Moat
- Explain whether this idea has a moat.
- If it does not yet, suggest what the moat could become over time.

6. Capital Reality Check
- Estimate whether this looks lean, moderate, or capital intensive to validate and pursue.
- Explain what resources I would likely need.

7. Risk / Reward
- Explain the upside, downside, time cost, and whether the reward appears worth the effort.

8. What I Should Validate First
- Identify the riskiest assumption.
- Suggest the smallest next test I should run within 7 days.

9. Provisional Scores
- Give a score out of 10 for:
  - Founder Fit
  - Unfair Advantage
  - Problem Strength
  - Defensibility
  - Capital Feasibility
  - Risk / Reward
  - Speed to Validation
  - Overall Priority
- Briefly explain each score.

10. Final Recommendation
- Choose one:
  - Pursue now
  - Test soon
  - Good idea, lower priority
  - Park
  - Drop
- Then explain why in plain English.`;
}

function render() {
  if (!promptOutput) {
    return;
  }

  const data = scoreIdea();

  Object.entries(scoreElements).forEach(([key, element]) => {
    if (element) {
      element.textContent = data[key].toFixed(1);
    }
  });

  Object.entries(noteElements).forEach(([key, element]) => {
    if (element) {
      element.textContent = getScoreNote(key, data[key], data);
    }
  });

  promptOutput.value = buildPrompt(data);
}

Object.values(fields).forEach((field) => {
  field?.addEventListener("input", render);
});

copyPromptButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(promptOutput.value);
    copyFeedback.textContent = "Prompt copied. Paste it into Gemini.";
  } catch (error) {
    copyFeedback.textContent = "Copy failed. You can still select and copy the prompt manually.";
  }
});

function getStoredUser() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function setStoredUser(user) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (error) {
    // Ignore storage errors in private mode or constrained browsers.
  }
}

function clearStoredUser() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    // Ignore storage errors.
  }
}

function applyLoginState(user) {
  if (!workspace) {
    render();
    return;
  }

  const isLoggedIn = Boolean(user?.name && user?.email);
  document.body.classList.toggle("is-logged-out", !isLoggedIn);

  workspace.classList.toggle("is-locked", !isLoggedIn);

  if (loginForm) {
    loginForm.hidden = isLoggedIn;
  }

  if (loginState) {
    loginState.hidden = !isLoggedIn;
  }

  if (loginStateName && isLoggedIn) {
    loginStateName.textContent = `${user.name} (${user.email})`;
  }

  if (loginName && !isLoggedIn) {
    loginName.value = "";
  }

  if (loginEmail && !isLoggedIn) {
    loginEmail.value = "";
  }

  render();
}

loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = loginName?.value.trim();
  const email = loginEmail?.value.trim();

  if (!name || !email) {
    return;
  }

  const user = { name, email };
  setStoredUser(user);
  applyLoginState(user);
});

logoutButton?.addEventListener("click", () => {
  clearStoredUser();
  applyLoginState(null);
});

applyLoginState(getStoredUser());
