function roleFocus(role) {
  if (/engineer|developer|full.?stack|front.?end|back.?end|software/i.test(role)) {
    return "Walk through one relevant project from architecture to testing and deployment, and be ready to explain the trade-offs you made.";
  }
  if (/design|product|ux|ui/i.test(role)) {
    return "Choose one portfolio case study and practice explaining the problem, your decisions, feedback, and measurable outcome.";
  }
  if (/data|analyst|science/i.test(role)) {
    return "Prepare a data project example that shows how you cleaned data, chose a method, checked results, and explained the outcome.";
  }
  return "Prepare one specific example of work that matches this role, including your contribution and the result.";
}

export function generateAiPreview(application, kind) {
  const { company, role } = application;
  if (kind === "follow-up") {
    const applied = new Date(application.dateApplied).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    return `Subject: Following up on my ${role} application at ${company}\n\nHello [Hiring Manager Name],\n\nI hope you're doing well. I applied for the ${role} position at ${company} on ${applied} and wanted to follow up on the status of my application. I'm interested in the opportunity and would welcome the chance to discuss how I could contribute to your team.\n\nPlease let me know if I can provide any additional information. Thank you for your time and consideration.\n\nBest,\n[Your Name]`;
  }
  return `1. Review the ${role} job description at ${company}. Pick three requirements and prepare a brief example showing your experience with each.\n\n2. ${roleFocus(role)}\n\n3. Prepare two thoughtful questions about ${company}'s team, priorities, and how success in this role is measured. Check the company's own careers and product pages first.`;
}
