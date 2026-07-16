function AgentTimeline() {
  const agents = [
    {
      name: "Requirement Analyzer",
      status: "Available",
    },
    {
      name: "Planner Agent",
      status: "Available",
    },
    {
      name: "Code Generator",
      status: "Coming Soon",
    },
    {
      name: "Execution Agent",
      status: "Coming Soon",
    },
    {
      name: "Reviewer Agent",
      status: "Planned",
    },
  ];

  return (
    <section className="timeline-section">
      <div className="section-title">
        <h2>Forge Pipeline</h2>
        <p>The autonomous engineering workflow powering Forge.</p>
      </div>

      <div className="timeline-grid">
        {agents.map((agent) => (
          <div className="timeline-card" key={agent.name}>
            <div className="timeline-dot" />

            <h3>{agent.name}</h3>

            <span className="timeline-status">
              {agent.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default AgentTimeline;