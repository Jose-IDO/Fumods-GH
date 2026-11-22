import styles from "./ManageBooking.module.css";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ConfirmDialog } from "../../Components/Shared/ConfirmDialog";
import { API_URL } from "../../config/api";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired" | "checked-in";
type Booking = {
  id: string;
  guest: string; // display name or userId fallback
  room: string;  // display room name or roomId fallback
  checkIn: string;   // ISO
  checkOut: string;  // ISO
  status: BookingStatus;
  expiresAt?: string;
  paymentStatus?: string;
  roomSelections?: Array<{ bedType: string; adults: number; babies: number }>;
  physicalRoomIds?: number[];
};

const StatusBadge = ({ status }: { status: BookingStatus }) => {
  if (status === "expired") return <span className={styles.statusCancelled}>Expired</span>;
  const className =
    status === "pending"
      ? styles.statusPending
      : status === "confirmed"
      ? styles.statusConfirmed
      : status === "cancelled"
      ? styles.statusCancelled
      : styles.statusCheckedIn;
  const label =
    status === "pending"
      ? "Pending"
      : status === "confirmed"
      ? "Confirmed"
      : status === "cancelled"
      ? "Cancelled"
      : "Checked-in";
  return <span className={className}>{label}</span>;
};

const BookingTable = ({
  title,
  data,
  onApprove,
  onCancel,
  onView,
  onCheckout,
  onCheckin, // NEW
}: {
  title: string;
  data: Booking[];
  onApprove: (id: string) => void;
  onCancel: (id: string) => void;
  onView: (id: string) => void;
  onCheckout: (id: string) => void;
  onCheckin: (id: string) => void; // NEW
}) => (
        <section className={styles.bookingSection}>
    <h3 className={styles.subtitle}>{title}</h3>
    <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
            <th scope="col">Booking ID</th>
            <th scope="col">Guest Name</th>
            <th scope="col">Room</th>
            <th scope="col">Check-in</th>
            <th scope="col">Check-out</th>
            <th scope="col">Status</th>
            <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className={styles.emptyCell}>
                No records found.
                </td>
              </tr>
          ) : (
            data.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.guest}</td>
                <td>{b.room}
                  {b.roomSelections?.map((room, index) => <div key={index} style={{marginTop: 6, fontSize: 12}}>
                    Room {b.physicalRoomIds?.[index] || index + 1}: {room.bedType === 'twin' ? 'Two single beds' : 'Double bed'}; {room.adults} adult(s){room.babies ? ', 1 baby' : ''}
                  </div>)}
                </td>
                <td>{new Date(b.checkIn).toLocaleDateString()}</td>
                <td>{new Date(b.checkOut).toLocaleDateString()}</td>
                <td><StatusBadge status={b.status} /><div>Payment: {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}</div>{b.status === 'pending' && b.expiresAt && <small>Confirm before {new Date(b.expiresAt).toLocaleString()}</small>}</td>
                <td>
                  {b.status === "pending" && (
                    <>
                      <button type="button" className={styles.approveBtn} aria-label={`Approve ${b.id}`} onClick={() => onApprove(b.id)}>Approve</button>
                      <button type="button" className={styles.cancelBtn} aria-label={`Cancel ${b.id}`} onClick={() => onCancel(b.id)}>Cancel</button>
                    </>
                  )}
                  {b.status === "confirmed" && (
                    <>
                      <button type="button" className={styles.viewBtn} aria-label={`View ${b.id}`} onClick={() => onView(b.id)}>View</button>
                      <button type="button" className={styles.checkinBtn} aria-label={`Check-in ${b.id}`} onClick={() => onCheckin(b.id)}>Check-in</button>
                      <button type="button" className={styles.cancelBtn} aria-label={`Cancel ${b.id}`} onClick={() => onCancel(b.id)}>Cancel</button>
                    </>
                  )}
                  {b.status === "checked-in" && (
                    <>
                      <button type="button" className={styles.viewBtn} aria-label={`View ${b.id}`} onClick={() => onView(b.id)}>View</button>
                      <button type="button" className={styles.checkoutBtn} aria-label={`Checkout ${b.id}`} onClick={() => onCheckout(b.id)}>Checkout</button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
            </tbody>
          </table>
    </div>
        </section>
);

export const ManageBooking = () => {
  const { token } = useAuth();
  const [statusFilter, setStatusFilter] = useState<"" | BookingStatus>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadBookings = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/bookings/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Check content type before parsing
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Server returned ${contentType} instead of JSON. Server might be down or misconfigured.`);
      }
      
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "Failed to load bookings");
      const list = (data.data || data).map((b: any) => ({
        id: b.id,
        guest: b.guestName || `${b.guestEmail || 'Unknown'}`,
        room: b.roomName || b.roomType || `Room ${b.roomId || '-'}`,
        checkIn: b.checkIn || b.check_in,
        checkOut: b.checkOut || b.check_out,
        status: (b.status as BookingStatus) || "pending",
        expiresAt: b.expiresAt, paymentStatus: b.paymentStatus, roomSelections: b.roomSelections, physicalRoomIds: b.physicalRoomIds,
      })) as Booking[];
      setBookings(list);
    } catch (e: any) {
      console.error('Error loading bookings:', e);
      setError(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    return bookings.filter(b => !statusFilter || b.status === statusFilter);
  }, [bookings, statusFilter]);

  const pending = filtered.filter((b) => b.status === "pending");
  const confirmed = filtered.filter((b) => b.status === "confirmed");
  // const checkedIn = filtered.filter((b) => b.status === "checked-in");

  const updateStatus = async (id: string, status: "confirmed" | "cancelled") => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) throw new Error(data.error || "Failed to update status");
      setSuccessMessage('Booking status updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      // Refresh list
      loadBookings();
    } catch (e) {
      setErrorMessage((e as any).message || "Failed to update booking");
      setTimeout(() => setErrorMessage(null), 5000);
    }
  };

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'info'
  });

  const handleApprove = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Booking',
      message: `Are you sure you want to approve booking ${id}?`,
      variant: 'info',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        updateStatus(id, "confirmed");
      }
    });
  };
  const handleCancel = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Booking',
      message: `Are you sure you want to cancel booking ${id}? This action may require notifying the guest.`,
      variant: 'warning',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        updateStatus(id, "cancelled");
      }
    });
  };
  const handleView = (_id: string) => {
  };
  const handleCheckin = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Check-in Guest',
      message: `Are you sure you want to check in the guest for booking ${id}?`,
      variant: 'info',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };
  const handleCheckout = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Checkout Booking',
      message: `Are you sure you want to checkout booking ${id}?`,
      variant: 'info',
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  return (
    <div className={styles.container}>
        {successMessage && <div className={styles.successAlert}>✓ {successMessage}</div>}
        {errorMessage && <div className={styles.errorAlert}>⚠️ {errorMessage}</div>}
      
      <div className={styles.headerBar}>
        <h1 className={styles.title}>Manage Bookings</h1>
        <div className={styles.actionsRow}>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as BookingStatus | "")}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option><option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className={styles.bookingSection}>
          <p>Loading bookings…</p>
        </div>
      )}
      {error && (
        <div className={styles.bookingSection}>
          <p style={{ color: '#b91c1c' }}>Error: {error}</p>
        </div>
      )}

      <BookingTable
        title="Pending Bookings"
        data={pending}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onView={handleView}
        onCheckout={handleCheckout}
        onCheckin={handleCheckin}
      />
      <BookingTable
        title="Confirmed Bookings"
        data={confirmed}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onView={handleView}
        onCheckout={handleCheckout}
        onCheckin={handleCheckin}
      />
      <BookingTable
        title="Cancelled / Expired Bookings"
        data={filtered.filter((b) => ["cancelled", "expired"].includes(b.status))}
        onApprove={handleApprove}
        onCancel={handleCancel}
        onView={handleView}
        onCheckout={handleCheckout}
        onCheckin={handleCheckin}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
