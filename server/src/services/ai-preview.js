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

export function generateAiPreview(application, kind, extra = {}) {
  const { company, role } = application;
  if (kind === "follow-up") {
    const applied = new Date(application.dateApplied).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
    return `Subject: Following up on my ${role} application at ${company}\n\nHello [Hiring Manager Name],\n\nI hope you're doing well. I applied for the ${role} position at ${company} on ${applied} and wanted to follow up on the status of my application. I'm interested in the opportunity and would welcome the chance to discuss how I could contribute to your team.\n\nPlease let me know if I can provide any additional information. Thank you for your time and consideration.\n\nBest,\n[Your Name]`;
  }
  if (kind === "cover-letter") {
    return `Dear Hiring Team at ${company},\n\nI am writing to express my strong enthusiasm for the ${role} role at ${company}. With a proven track record of developing scalable applications, optimizing performance, and collaborating effectively across teams, I am confident in my ability to deliver immediate value.\n\nThroughout my experience, I have designed resilient architectures, tackled complex problem spaces, and prioritized user-centric features. The mission and engineering excellence at ${company} align directly with my technical background and career goals.\n\nThank you for considering my application. I look forward to the possibility of discussing how my skills and background can support the team's upcoming initiatives.\n\nSincerely,\n[Applicant Name]`;
  }
  if (kind === "match-score") {
    return JSON.stringify({
      score: 82,
      summary: `Your profile demonstrates strong alignment with the ${role} position at ${company}, particularly in core technical foundations and system implementation.`,
      matchingSkills: ["JavaScript/TypeScript", "React", "Node.js", "REST APIs", "Problem Solving"],
      missingKeywords: ["Cloud Architecture (AWS)", "Automated Unit/Integration Testing", "Microservices Design"],
      recommendations: [
        `Explicitly highlight your experience building production features relevant to ${role}.`,
        "Quantify project achievements with measurable business and performance metrics.",
        "Add key technical keywords from the job description directly into your resume summary."
      ]
    });
  }
  return `1. Review the ${role} job description at ${company}. Pick three requirements and prepare a brief example showing your experience with each.\n\n2. ${roleFocus(role)}\n\n3. Prepare two thoughtful questions about ${company}'s team, priorities, and how success in this role is measured. Check the company's own careers and product pages first.`;
}
