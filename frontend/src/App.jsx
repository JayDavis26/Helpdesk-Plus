import { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("User");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  useEffect(() => {
    if (loggedIn) {
      fetch("http://localhost:5000/api/tickets")
        .then((response) => response.json())
        .then((data) => {
          setTickets(data);
        })
        .catch((error) => {
          console.error("Error fetching tickets:", error);
        });
    }
  }, [loggedIn]);

  async function handleTicketSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);

    const ticketData = {
      title: formData.get("title"),
      description: formData.get("description"),
      category: formData.get("category"),
      priority: formData.get("priority")
    };

    try {
      const response = await fetch("http://localhost:5000/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(ticketData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create ticket");
      }

      setTicketNumber(data.ticketNumber);
      setTicketSubmitted(true);
    } catch (error) {
      console.error("Error submitting ticket:", error);
      alert("Failed to create ticket. Please try again.");
    }
  }

  async function handleTicketUpdate() {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${selectedTicket._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: selectedTicket.status,
            priority: selectedTicket.priority
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update ticket");
      }

      setSelectedTicket(data);

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket._id === data._id ? data : ticket
        )
      );

      alert("Ticket updated successfully.");
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket.");
    }
  }

  if (loggedIn) {
    if (selectedTicket) {
      return (
        <div className="dashboard">
          <header className="dashboard-header">
            <h1>Helpdesk+</h1>

            <button onClick={() => setSelectedTicket(null)}>
              Back to Tickets
            </button>
          </header>

          <main className="dashboard-content">
            <div className="ticket-form-card">
              <h2>{selectedTicket.ticketNumber}</h2>

              <h3>{selectedTicket.title}</h3>

              <p>
                <strong>Description:</strong>
              </p>

              <p>{selectedTicket.description}</p>

              <p>
                <strong>Category:</strong> {selectedTicket.category}
              </p>

              <label htmlFor="ticket-detail-assigned">
  <strong>Assigned To:</strong>
</label>

<select
  id="ticket-detail-assigned"
  value={selectedTicket.assignedTo || "Unassigned"}
  onChange={(event) =>
    setSelectedTicket({
      ...selectedTicket,
      assignedTo: event.target.value
    })
  }
>
  <option>Unassigned</option>
  <option>IT agent 1</option>
  <option>IT agennt 2</option>
  <option>IT Agent 3</option>
</select>

<button
  className="submit-ticket-button"
  onClick={async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${selectedTicket._id}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            assignedTo: selectedTicket.assignedTo
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to assign ticket");
      }

      setSelectedTicket(data);

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket._id === data._id ? data : ticket
        )
      );

      alert("Ticket assigned successfully.");
    } catch (error) {
      console.error("Error assigning ticket:", error);
      alert("Failed to assign ticket.");
    }
  }}
>
  Assign Ticket
</button>

              <div className="ticket-comments">
  <h3>Comments</h3>

  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
    selectedTicket.comments.map((comment, index) => (
      <div className="comment-item" key={index}>
        <strong>{comment.author}</strong>
        <p>{comment.text}</p>
      </div>
    ))
  ) : (
    <p>No comments yet.</p>
  )}

  <form
    onSubmit={async (event) => {
      event.preventDefault();

      const commentText = event.target.comment.value.trim();

      if (!commentText) {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/tickets/${selectedTicket._id}/comments`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              text: commentText,
              author: "User"
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to add comment");
        }

        setSelectedTicket(data);

        setTickets((currentTickets) =>
          currentTickets.map((ticket) =>
            ticket._id === data._id ? data : ticket
          )
        );

        event.target.reset();
      } catch (error) {
        console.error("Error adding comment:", error);
        alert("Failed to add comment.");
      }
    }}
  >
    <textarea
      name="comment"
      placeholder="Write a comment..."
      required
    ></textarea>

    <button
      type="submit"
      className="submit-ticket-button"
    >
      Add Comment
    </button>
  </form>
</div>

              <label htmlFor="ticket-detail-priority">
                <strong>Priority:</strong>
              </label>

              <select
                id="ticket-detail-priority"
                value={selectedTicket.priority}
                onChange={(event) =>
                  setSelectedTicket({
                    ...selectedTicket,
                    priority: event.target.value
                  })
                }
              >
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
                <option>Critical</option>
              </select>

              <label htmlFor="ticket-detail-status">
                <strong>Status:</strong>
              </label>

              <select
                id="ticket-detail-status"
                value={selectedTicket.status}
                onChange={(event) =>
                  setSelectedTicket({
                    ...selectedTicket,
                    status: event.target.value
                  })
                }
              >
                <option>New</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Waiting for User</option>
                <option>Resolved</option>
                <option>Closed</option>
              </select>

              <button
                className="submit-ticket-button"
                onClick={handleTicketUpdate}
              >
                Save Changes
              </button>

              {selectedTicket.status !== "Resolved" &&
                 selectedTicket.status !== "Closed" && (
                  <button
  className="submit-ticket-button"
  onClick={async () => {
    const updatedTicket = {
      ...selectedTicket,
      status: "Resolved"
    };

    setSelectedTicket(updatedTicket);

    try {
      const response = await fetch(
        `http://localhost:5000/api/tickets/${selectedTicket._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            status: "Resolved",
            priority: selectedTicket.priority
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resolve ticket");
      }

      setSelectedTicket(data);

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket._id === data._id ? data : ticket
        )
      );

      alert("Ticket resolved successfully.");
    } catch (error) {
      console.error("Error resolving ticket:", error);
      alert("Failed to resolve ticket.");
    }
  }}
>
  Resolve Ticket
</button>
  )}

  {selectedTicket.status === "Resolved" && (
  <button
    className="submit-ticket-button"
    onClick={async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/tickets/${selectedTicket._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              status: "Closed",
              priority: selectedTicket.priority
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to close ticket");
        }

        setSelectedTicket(data);

        setTickets((currentTickets) =>
          currentTickets.map((ticket) =>
            ticket._id === data._id ? data : ticket
          )
        );

        alert("Ticket closed successfully.");
      } catch (error) {
        console.error("Error closing ticket:", error);
        alert("Failed to close ticket.");
      }
    }}
  >
    Close Ticket
  </button>
)}

{selectedTicket.status === "Closed" && (
  <button
    className="submit-ticket-button"
    onClick={async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/tickets/${selectedTicket._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              status: "Open",
              priority: selectedTicket.priority
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to reopen ticket");
        }

        setSelectedTicket(data);

        setTickets((currentTickets) =>
          currentTickets.map((ticket) =>
            ticket._id === data._id ? data : ticket
          )
        );

        alert("Ticket reopened successfully.");
      } catch (error) {
        console.error("Error reopening ticket:", error);
        alert("Failed to reopen ticket.");
      }
    }}
  >
    Reopen Ticket
  </button>
)}

              <button
                className="submit-ticket-button"
                onClick={() => setSelectedTicket(null)}
              >
                Back to Tickets
              </button>
            </div>
          </main>
        </div>
      );
    }

    if (showCreateTicket) {
      if (ticketSubmitted) {
        return (
          <div className="dashboard">
            <header className="dashboard-header">
              <h1>Helpdesk+</h1>

              <button
                onClick={() => {
                  setShowCreateTicket(false);
                  setTicketSubmitted(false);
                }}
              >
                Back to Dashboard
              </button>
            </header>

            <main className="dashboard-content">
              <div className="ticket-form-card">
                <h2>Ticket Submitted</h2>

                <p>
                  Your ticket has been created successfully.
                </p>

                <p>
                  <strong>Ticket Number:</strong> {ticketNumber}
                </p>

                <button
                  className="submit-ticket-button"
                  onClick={() => {
                    setShowCreateTicket(false);
                    setTicketSubmitted(false);
                  }}
                >
                  Back to Dashboard
                </button>
              </div>
            </main>
          </div>
        );
      }

      return (
        <div className="dashboard">
          <header className="dashboard-header">
            <h1>Helpdesk+</h1>

            <button
              onClick={() => setShowCreateTicket(false)}
            >
              Back to Dashboard
            </button>
          </header>

          <main className="dashboard-content">
            <div className="ticket-form-card">
              <h2>Create Ticket</h2>

              <form onSubmit={handleTicketSubmit}>
                <label htmlFor="title">Title</label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Enter ticket title"
                  required
                />

                <label htmlFor="description">Description</label>

                <textarea
                  id="description"
                  name="description"
                  placeholder="Describe your issue"
                  required
                ></textarea>

                <label htmlFor="category">Category</label>

                <select id="category" name="category" required>
                  <option value="">Select a category</option>
                  <option>Technical Support</option>
                  <option>Account Issues</option>
                  <option>Billing</option>
                  <option>Hardware</option>
                  <option>Software</option>
                  <option>General Questions</option>
                </select>

                <label htmlFor="priority">Priority</label>

                <select id="priority" name="priority">
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
            </div>
          </main>
        </div>
      );
    }

    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Helpdesk+</h1>

          <button onClick={() => setLoggedIn(false)}>
            Logout
          </button>
        </header>

        <main className="dashboard-content">
          <h2>Dashboard</h2>

          <p>
             Welcome to your Helpdesk+ dashboard.
            You are logged in as a <strong>{userRole}</strong>.
          </p>

          <button
            className="submit-ticket-button"
            onClick={() => setShowCreateTicket(true)}
          >
            + Create Ticket
          </button>

          {userRole === "Support Agent" && (
           <div className="dashboard-card">
            <h3>Support Agent Tools</h3>
            <p>Manage, assign, and resolve support tickets.</p>
          </div>
          )}

          {userRole === "Administrator" && (
  <div className="dashboard-card">
    <h3>Administrator Tools</h3>

    <p>Manage users, tickets, and system activity.</p>

    <p>
      <strong>Total Tickets:</strong> {tickets.length}
    </p>

    <p>
      <strong>Open Tickets:</strong>{" "}
      {
        tickets.filter(
          (ticket) =>
            ticket.status !== "Resolved" &&
            ticket.status !== "Closed"
        ).length
      }
    </p>

    <p>
      <strong>Resolved/Closed:</strong>{" "}
      {
        tickets.filter(
          (ticket) =>
            ticket.status === "Resolved" ||
            ticket.status === "Closed"
        ).length
      }
    </p>
  </div>
)}

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>My Tickets</h3>
              <p>{tickets.length}</p>
            </div>

            <div className="dashboard-card">
              <h3>Open Tickets</h3>
              <p>
                {
                  tickets.filter(
                    (ticket) =>
                      ticket.status !== "Resolved" &&
                      ticket.status !== "Closed"
                  ).length
                }
              </p>
            </div>

            <div className="dashboard-card">
              <h3>Resolved Tickets</h3>
              <p>
                {
                  tickets.filter(
                    (ticket) =>
                      ticket.status === "Resolved" ||
                      ticket.status === "Closed"
                  ).length
                }
              </p>
            </div>
          </div>

          <div className="ticket-list">
            <h2>My Tickets</h2>
                <div className="ticket-filters">
  <input
    type="text"
    placeholder="Search tickets..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
  />

  <select
    value={filterStatus}
    onChange={(event) => setFilterStatus(event.target.value)}
  >
    <option value="All">All Statuses</option>
    <option value="New">New</option>
    <option value="Open">Open</option>
    <option value="In Progress">In Progress</option>
    <option value="Waiting for User">Waiting for User</option>
    <option value="Resolved">Resolved</option>
    <option value="Closed">Closed</option>
  </select>

  <select
    value={filterPriority}
    onChange={(event) => setFilterPriority(event.target.value)}
  >
    <option value="All">All Priorities</option>
    <option value="Low">Low</option>
    <option value="Medium">Medium</option>
    <option value="High">High</option>
    <option value="Critical">Critical</option>
  </select>
        </div>

           {tickets.length === 0 ? (
  <p>No tickets have been created yet.</p>
) : (
  tickets
    .filter((ticket) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        ticket.ticketNumber.toLowerCase().includes(search) ||
        ticket.title.toLowerCase().includes(search) ||
        ticket.category.toLowerCase().includes(search);

      const matchesStatus =
        filterStatus === "All" ||
        ticket.status === filterStatus;

      const matchesPriority =
        filterPriority === "All" ||
        ticket.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    })
    .map((ticket) => (
      <div
        className="ticket-list-item"
        key={ticket._id}
        onClick={() => setSelectedTicket(ticket)}
        style={{ cursor: "pointer" }}
      >
        <div>
          <h3>{ticket.ticketNumber}</h3>
          <p>{ticket.title}</p>
        </div>

        <div>
          <span>{ticket.category}</span>
          <span>{ticket.priority}</span>
          <span>{ticket.status}</span>
        </div>
      </div>
    ))
)}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Helpdesk+</h1>

        <p className="subtitle">
          Ticket Management System
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setLoggedIn(true);
          }}
        >
          <label htmlFor="email">Email or Username</label>

          <input
            id="email"
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
          
          <label htmlFor="role">Account Type</label>

          <select
            id="role"
            value={userRole}
            onChange={(event) => setUserRole(event.target.value)}
          >
            <option value="User">Regular User</option>
            <option value="Support Agent">Support Agent</option>
            <option value="Administrator">Administrator</option>
</select>

          <button type="submit">
            Login
          </button>
        </form>

        <p className="signup-text">
          Don't have an account? <a href="#">Create Account</a>
        </p>
      </div>
    </div>
  );
}

export default App;