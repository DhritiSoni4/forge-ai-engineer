function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <span className="logo-glow">◆</span>
        Forge
      </div>

      <div className="navbar-links">
        <a href="#">Planner</a>
        <a href="#">Agents</a>
        <a href="#">Roadmap</a>
      </div>

      <div className="navbar-badge">
        AI Engineer
        <span>Beta</span>
      </div>
    </nav>
  );
}

export default Navbar;