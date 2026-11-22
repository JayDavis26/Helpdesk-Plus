import { useState, useEffect } from "react";
import "./App.css";
import NotificationCenter, { notify } from "./notification.jsx";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("User");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [savedAssignee, setSavedAssignee] = useState("Unassigned");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");

  useEffect(() => {
  if (!loggedIn) return;

  const token = sessionStorage.getItem("helpdeskToken");

  if (!token) {
    console.error("No authentication token found.");
    return;
  }

  fetch("https://helpdesk-plus-2.onrender.com/api/tickets", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(async (response) => {
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch tickets.");
      }

      return data;
    })
    .then((data) => setTickets(data))
    .catch((error) => {
      console.error("Error fetching tickets:", error);
    });
}, [loggedIn]);

  useEffect(() => {
    if (!loggedIn || userRole !== "Administrator") return;

    const token = sessionStorage.getItem("helpdeskToken");
  if (!token) {
  console.error("Admin session missing. Please sign out and sign in again.");
  return;
}

   let cancelled = false;
    fetch("https://helpdesk-plus-2.onrender.com/api/auth/users", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Could not load registered users.");
        return data;
      })
      .then((data) => { if (!cancelled) setRegisteredUsers(data); })
      .catch((error) => { if (!cancelled) setUsersError(error.message); })
      .finally(() => { if (!cancelled) setUsersLoading(false); });

    return () => { cancelled = true; };
  }, [loggedIn, userRole]);

async function handleTicketSubmit(event) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  try {
    const token = sessionStorage.getItem("helpdeskToken");

    const response = await fetch("https://helpdesk-plus-2.onrender.com//api/tickets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to create ticket");
    }

    setTicketNumber(data.ticketNumber);
    setTicketSubmitted(true);
    notify(`Ticket ${data.ticketNumber} was created successfully.`, "success");
  } catch (error) {
    console.error("Error submitting ticket:", error);
    alert("Failed to create ticket. Please try again.");
  }
}

  async function handleTicketUpdate() {
    try {
      const token = sessionStorage.getItem("helpdeskToken");

const response = await fetch(
  `https://helpdesk-plus-2.onrender.com/api/tickets/${selectedTicket._id}`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
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

      notify(`Ticket ${data.ticketNumber || "Ticket"} was updated successfully.`, "success");
      alert("Ticket updated successfully.");
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket.");
    }
  }

  if (loggedIn) {
    if (selectedTicket) {
      return (
        <div
  className={`dashboard ${
    userRole === "Administrator"
      ? "dashboard-admin"
      : userRole === "Support Agent"
      ? "dashboard-agent"
      : ["User", "Regular User"].includes(userRole)
        ? "dashboard-user"
      : ""
  }`}
>
          <div className="dashboard-notifications"><NotificationCenter /></div>
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
                <strong>Submitted By:</strong>{" "}
                 {selectedTicket.submitterName || "Not provided"}
              </p>

              <p>
                <strong>Email Address:</strong>{" "}
                {selectedTicket.submitterEmail || "Not provided"}
              </p>


              <p>
                <strong>Created:</strong>{" "}
                {new Date(selectedTicket.createdAt).toLocaleString()}
              </p>

                <p>
                <strong>Last Updated:</strong>{" "}
                {new Date(selectedTicket.updatedAt).toLocaleString()}
              </p>

              <p>
                  <strong>Currently Assigned To:</strong>{" "}
                  {savedAssignee}
              </p>

              <p>
                  <strong>Priority:</strong>{" "}
                  {selectedTicket.priority || "Not set"}
              </p>

              <p>
                <strong>Description:</strong>
              </p>

              <p>{selectedTicket.description}</p>

              <section className="ticket-attachments">
                <h3>Attachments</h3>
                {selectedTicket.attachments?.length ? (
                  <ul>
                    {selectedTicket.attachments.map((attachment) => (
                      <li key={attachment.filename}>
                        <a
                          href={`https://helpdesk-plus-2.onrender.com/${attachment.url}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {attachment.originalName}
                        </a>
                        <span> ({(attachment.size / 1024).toFixed(1)} KB)</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No attachments were added to this ticket.</p>
                )}
              </section>

              <p>
                <strong>Category:</strong> {selectedTicket.category}
              </p>

            {["Administrator", "Support Agent"].includes(userRole) && (
              <>
              <label htmlFor="ticket-detail-assigned">
  <strong>Assigned To:</strong>
</label>
</>
            )}
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
  <option>IT agent 2</option>
  <option>IT Agent 3</option>
</select>

<button
  className="submit-ticket-button"
  onClick={async () => {
    console.log("Assign Ticket button clicked");
    try {
      const token = sessionStorage.getItem("helpdeskToken");

const response = await fetch(
  `https://helpdesk-plus-2.onrender.com/api/tickets/${selectedTicket._id}/assign`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
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
      setSavedAssignee(data.assignedTo || "Unassigned");
      
      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket._id === data._id ? data : ticket
        )
      );

      notify(`Ticket ${data.ticketNumber || "Ticket"} was assigned to ${data.assignedTo}.`, "success");
      alert("Ticket assigned successfully.");
    } catch (error) {
      console.error("Error assigning ticket:", error);
      alert("Failed to assign ticket.");
    }
  }}
>
  Assign Ticket
</button>

<div className="ticket-activity">
  <h3>Activity History</h3>

  {selectedTicket.activityHistory &&
  selectedTicket.activityHistory.length > 0 ? (
    selectedTicket.activityHistory
      .slice()
      .reverse()
      .map((activity, index) => (
        <div className="activity-item" key={index}>
          <strong>{activity.action}</strong>
          <p>{activity.details}</p>
          <small>
            {activity.performedBy} ·{" "}
            {new Date(activity.createdAt).toLocaleString()}
          </small>
        </div>
      ))
  ) : (
    <p>No activity recorded yet.</p>
  )}
</div>

              <div className="ticket-comments">
  <h3>Comments</h3>

  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
  selectedTicket.comments.map((comment, index) => (
    <div className="comment-item" key={comment._id || index}>
      <strong>{comment.author}</strong>
      <p>{comment.text}</p>

      <button
        type="button"
        onClick={async () => {
          const confirmed = window.confirm(
            "Are you sure you want to delete this comment?"
          );

          if (!confirmed) return;

          try {
            const token = sessionStorage.getItem("helpdeskToken");

const response = await fetch(
  `https://helpdesk-plus-2.onrender.com/api/tickets/${selectedTicket._id}/comments/${comment._id}`,
  {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
);

            const updatedTicket = await response.json();

            if (!response.ok) {
              throw new Error(
                updatedTicket.message || "Failed to delete comment"
              );
            }

            setSelectedTicket(updatedTicket);
            setTickets((previousTickets) =>
              previousTickets.map((ticket) =>
                ticket._id === updatedTicket._id
                  ? updatedTicket
                  : ticket
              )
            );
          } catch (error) {
            alert(error.message);
          }
        }}
      >
        Delete Comment
      </button>
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
        const token = sessionStorage.getItem("helpdeskToken");

const response = await fetch(
  `https://helpdesk-plus-2.onrender.com/api/tickets/${selectedTicket._id}/comments`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      text: commentText,
    })
  }
);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to add comment");
        }

        setSelectedTicket(data);
        setSavedAssignee(
        data.assignedTo || selectedTicket.assignedTo || "Unassigned"
        );

        setTickets((currentTickets) =>
          currentTickets.map((ticket) =>
            ticket._id === data._id ? data : ticket
          )
        );

        notify(`A comment was added to ${data.ticketNumber || "the ticket"}.`, "success");
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

                {["Administrator", "Support Agent"].includes(userRole) && (
                  <>
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
              </>
                )}

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
      const token = sessionStorage.getItem("helpdeskToken");

const response = await fetch(
  `https://helpdesk-plus-2.onrender.com/api/tickets/${selectedTicket._id}`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      status: "Resolved",
      priority: selectedTicket.priority
    })
  }
);

      const data = await response.json();
      console.log("Assignment response:", data);
      console.log("Returned assignedTo:", data.assignedTo);

      if (!response.ok) {
        throw new Error(data.message || "Failed to resolve ticket");
      }

      setSelectedTicket(data);

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket._id === data._id ? data : ticket
        )
      );

      notify(`Ticket ${data.ticketNumber || "Ticket"} was resolved.`, "success");
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
        const token = sessionStorage.getItem("helpdeskToken");

const response = await fetch(
  `https://helpdesk-plus-2.onrender.com/api/tickets/${selectedTicket._id}`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
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

        notify(`Ticket ${data.ticketNumber || "Ticket"} was closed.`, "success");
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
        const token = sessionStorage.getItem("helpdeskToken");

const response = await fetch(
  `https://helpdesk-plus-2.onrender.com/api/tickets/${selectedTicket._id}`,
  {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
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

        notify(`Ticket ${data.ticketNumber || "Ticket"} was reopened.`, "success");
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
          <div
  className={`dashboard ${
    userRole === "Administrator"
      ? "dashboard-admin"
      : userRole === "Support Agent"
      ? "dashboard-agent"
      : ["User", "Regular User"].includes(userRole)
        ? "dashboard-user"
      : ""
  }`}
>
          <div className="dashboard-notifications"><NotificationCenter /></div>
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
        <div
  className={`dashboard ${
    userRole === "Administrator"
      ? "dashboard-admin"
      : userRole === "Support Agent"
      ? "dashboard-agent"
      : ["User", "Regular User"].includes(userRole)
        ? "dashboard-user"
      : ""
  }`}
>
          <div className="dashboard-notifications"><NotificationCenter /></div>
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
              <label htmlFor="submitterName">Full Name</label>
              <input
                id="submitterName"
                name="submitterName"
                type="text"
                placeholder="Enter your full name"
                required
              />

              <label htmlFor="submitterEmail">Email Address</label>
              <input
                id="submitterEmail"
                name="submitterEmail"
                type="email"
                placeholder="Enter your email address"
                required
              />

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

                <label htmlFor="attachments">
                   Pictures and Videos (optional)
                </label>

                <input
                  id="attachments"
                  name="attachments"
                  type="file"
                  multiple
                  accept=".png,.jpg,.jpeg,.gif,.webp,.mp4,.mov,.webm"
                />

                <p className="attachment-help">
                Up to 5 pictures or videos, maximum 50 MB each.
                Supported: PNG, JPG, JPEG, GIF, WebP, MP4, MOV, and WebM.
                </p>

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
      <div
  className={`dashboard ${
    userRole === "Administrator"
      ? "dashboard-admin"
      : userRole === "Support Agent"
      ? "dashboard-agent"
      : ["User", "Regular User"].includes(userRole)
        ? "dashboard-user"
      : ""
  }`}
>
          <div className="dashboard-notifications"><NotificationCenter /></div>
        <header className="dashboard-header">
          <h1>Helpdesk+</h1>

          <button onClick={() => {
            setLoggedIn(false);
            setUserRole("User");
            sessionStorage.removeItem("helpdeskToken");
            sessionStorage.removeItem("helpdeskUser");
            setRegisteredUsers([]);
          }}>
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

  {userRole === "Administrator" && (
  <div className="dashboard-card">
    <h3>User Management</h3>

    <p>View registered users, their email addresses, and roles.</p>
    <p><strong>Registered users:</strong> {registeredUsers.length}</p>
    <button type="button" onClick={() => {
      const token = sessionStorage.getItem("helpdeskToken");
      if (!token) { setUsersError("Your admin session is missing. Please log out and sign in again."); return; }
      setUsersLoading(true);
      setUsersError("");
      fetch("https://helpdesk-plus-2.onrender.com/api/auth/users", { headers: { Authorization: `Bearer ${token}` } })
        .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.message || "Could not load users."); return data; })
        .then(setRegisteredUsers)
        .catch((error) => setUsersError(error.message))
        .finally(() => setUsersLoading(false));
    }}>Refresh Users</button>

    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
        </tr>
      </thead>

      <tbody>
        {usersLoading ? (
          <tr><td colSpan="3">Loading registered users...</td></tr>
        ) : usersError ? (
          <tr><td colSpan="3">{usersError}</td></tr>
        ) : registeredUsers.length === 0 ? (
          <tr><td colSpan="3">No registered users found.</td></tr>
        ) : (
          registeredUsers.map((user) => (
            <tr key={user.id}>
              <td>{user.name || "—"}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
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
        onClick={() => {
          setSelectedTicket(ticket);
          setSavedAssignee(ticket.assignedTo || "Unassigned");
        }}
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

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const name = String(form.get("name") || "").trim();

    try {
      const response = await fetch(
        `https://helpdesk-plus-2.onrender.com/api/auth/${isRegistering ? "register" : "login"}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name })
        }
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Authentication failed.");
      }

      // The server decides the role. A person cannot choose Administrator in the browser.
      setUserRole(data.user.role);
      setLoggedIn(true);
      setIsRegistering(false);
      setAuthError("");
      if (data.token) {
        sessionStorage.setItem("helpdeskToken", data.token);
        sessionStorage.setItem("helpdeskUser", JSON.stringify(data.user));
      }
      notify(
        isRegistering ? "Account created successfully." : "Signed in successfully.",
        "success"
      );
    } catch (error) {
      setAuthError(error.message || "Could not connect to the Helpdesk+ server.");
    } finally {
      setAuthLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Helpdesk+</h1>

        <p className="subtitle">
          Ticket Management System
        </p>

        <form onSubmit={handleAuthSubmit}>
          {isRegistering && (
            <>
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                required
                maxLength={100}
              />
            </>
          )}

          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email address"
            autoComplete="email"
            required
            maxLength={254}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder={isRegistering ? "Create a password (8+ characters)" : "Enter your password"}
            autoComplete={isRegistering ? "new-password" : "current-password"}
            minLength={isRegistering ? 8 : 1}
            required
          />

          {authError && (
            <p className="auth-error" role="alert">{authError}</p>
          )}

          <button type="submit" disabled={authLoading}>
            {authLoading
              ? "Please wait..."
              : isRegistering
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <p className="signup-text">
          {isRegistering ? "Already have an account? " : "Don't have an account? "}
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              setIsRegistering((current) => !current);
              setAuthError("");
            }}
          >
            {isRegistering ? "Sign In" : "Create Account"}
          </a>
        </p>
        <p className="subtitle">
          Administrator accounts must be configured by the system administrator.
        </p>
      </div>
    </div>
  );
}

export default App;
