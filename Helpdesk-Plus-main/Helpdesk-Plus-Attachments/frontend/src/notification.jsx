import { useEffect, useState } from "react";
import "./notification.css";

const NOTIFICATION_EVENT = "helpdesk-plus:notification";

/** Send a notification from anywhere in the Helpdesk+ frontend. */
export function notify(message, type = "info") {
  window.dispatchEvent(
    new CustomEvent(NOTIFICATION_EVENT, {
      detail: { message, type, id: `${Date.now()}-${Math.random()}` },
    })
  );
}

/** Floating notification center with a recent-notifications list. */
export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    function handleNotification(event) {
      const notification = {
        ...event.detail,
        createdAt: new Date(),
        read: false,
      };
      setNotifications((current) => [notification, ...current].slice(0, 30));
      setToast(notification);
      window.setTimeout(() => {
        setToast((current) => (current?.id === notification.id ? null : current));
      }, 4000);
    }

    window.addEventListener(NOTIFICATION_EVENT, handleNotification);
    return () => window.removeEventListener(NOTIFICATION_EVENT, handleNotification);
  }, []);

  const unreadCount = notifications.filter((item) => !item.read).length;

  function markAllRead() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }

  return (
    <div className="notification-center">
      <button
        type="button"
        className="notification-bell"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
          setToast(null);
        }}
      >
        <span aria-hidden="true">🔔</span>
        <span>Notifications</span>
        {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
      </button>

      {toast && !open && (
        <div className={`notification-toast notification-${toast.type}`} role="status">
          <span>{toast.message}</span>
          <button type="button" aria-label="Dismiss notification" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {open && (
        <section className="notification-panel" aria-label="Recent notifications">
          <div className="notification-panel-header">
            <strong>Notifications</strong>
            <button type="button" onClick={markAllRead}>Mark all read</button>
          </div>
          {notifications.length === 0 ? (
            <p className="notification-empty">You’re all caught up. Ticket updates will appear here.</p>
          ) : (
            <ul>
              {notifications.map((item) => (
                <li className={item.read ? "notification-read" : "notification-unread"} key={item.id}>
                  <span className={`notification-dot notification-${item.type}`} />
                  <div>
                    <p>{item.message}</p>
                    <small>{item.createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
