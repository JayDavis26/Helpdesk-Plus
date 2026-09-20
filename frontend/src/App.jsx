import { useState } from "react";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");

  function handleTicketSubmit(event) {
  event.preventDefault();

  const newTicketNumber = "TKT-000001";

  setTicketNumber(newTicketNumber);
  setTicketSubmitted(true);
}

  if (loggedIn) {

    if (ticketSubmitted) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Helpdesk+</h1>

        <button
          onClick={() => {
            setTicketSubmitted(false);
            setShowCreateTicket(false);
          }}
        >
          Back to Dashboard
        </button>
      </header>

      <main className="dashboard-content">
        <div className="ticket-form-card">
          <h2>Ticket Submitted</h2>

          <p>
            Your support ticket has been successfully created.
          </p>

          <p>
            <strong>Ticket Number:</strong> {ticketNumber}
          </p>

          <button
            className="submit-ticket-button"
            onClick={() => {
              setTicketSubmitted(false);
              setShowCreateTicket(false);
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

    if (showCreateTicket) {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Helpdesk+</h1>

        <button onClick={() => setShowCreateTicket(false)}>
          Back to Dashboard
        </button>
      </header>

      <main className="dashboard-content">
        <h2>Create a Ticket</h2>
        <p>Submit a support request to the Helpdesk team.</p>

        <form
          className="ticket-form-card"
          onSubmit={handleTicketSubmit}
        >
          <label htmlFor="ticket-title">Title</label>
          <input
            id="ticket-title"
            type="text"
            placeholder="Briefly describe your issue"
          />

          <label htmlFor="ticket-description">Description</label>
          <textarea
            id="ticket-description"
            placeholder="Describe your problem in detail"
            rows="6"
          />

          <label htmlFor="ticket-category">Category</label>
          <select id="ticket-category">
            <option>Technical Support</option>
            <option>Account Issues</option>
            <option>Billing</option>
            <option>Hardware</option>
            <option>Software</option>
            <option>General Questions</option>
          </select>

          <label htmlFor="ticket-priority">Priority</label>
          <select id="ticket-priority">
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>

          <button
            type="submit"
            className="submit-ticket-button"
          >
            Submit Ticket
          </button>
        </form>
      </main>
    </div>
  );
}

    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Helpdesk+</h1>
          <button onClick={() => setLoggedIn(false)}>Logout</button>
        </header>

        <main className="dashboard-content">
          <h2>Welcome to Helpdesk+</h2>
          <p>Ticket Management Dashboard</p>

          <button
            className="create-ticket-button"
            onClick={() => setShowCreateTicket(true)}
          >
            + Create Ticket
          </button>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>My Tickets</h3>
              <p>0</p>
            </div>

            <div className="dashboard-card">
              <h3>Open Tickets</h3>
              <p>0</p>
            </div>

            <div className="dashboard-card">
              <h3>Resolved Tickets</h3>
              <p>0</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  function handleLogin(event) {
    event.preventDefault();
    setLoggedIn(true);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Helpdesk+</h1>
        <p className="subtitle">Ticket Management System</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="username">Email or Username</label>

          <input
            id="username"
            type="text"
            placeholder="Enter your email or username"
            required
          />

          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            required
          />

          <button type="submit">Login</button>
        </form>

        <p className="signup-text">
          Don't have an account? <a href="#">Create Account</a>
        </p>
      </div>
    </div>
  );
}

export default App;