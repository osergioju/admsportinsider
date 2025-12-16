import { useState } from "react";
import { api } from "../../services/api"
import { useNotificationPolling } from "../../hooks/useNotificationPolling";

export default function UserNotification() {
  const [notifications, setNotifications] = useState([]);

  async function fetchNotifications() {
    try {
      const { data } = await api.get("/user/notifications");
      console.log(data);
      setNotifications(data);
    } catch (error) {
      console.error(error);
    }
  }

  useNotificationPolling({
    fetchFn: fetchNotifications,
    activeInterval: 10000,
    inactiveInterval: 90000,
  });

  return (
    <div>
      <h2>Minhas notificações</h2>

      {notifications.map((n) => (
        <div key={n.id}>
          <strong>{n.title}</strong>
          {!n.read_at && <span> 🔴</span>}
        </div>
      ))}
    </div>
  );
}

