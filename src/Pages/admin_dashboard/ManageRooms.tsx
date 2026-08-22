import React, { useState, useEffect } from "react";
import styles from "./ManageRooms.module.css"
import { RoomImageUpload } from "../../Components/RoomImageUpload/RoomImageUpload";
import { ConfirmDialog } from "../../Components/Shared/ConfirmDialog";
import { API_URL } from "../../config/api";

export const ManageRooms: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedRoomForImages, setSelectedRoomForImages] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [archivedRooms, setArchivedRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomImages, setEditingRoomImages] = useState<string[]>([]);
  const [editingUnits, setEditingUnits] = useState<any[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterBedType, setFilterBedType] = useState("all");
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
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
    variant: 'warning'
  });
  const [formData, setFormData] = useState({
    roomName: "",
    roomType: "",
    newRoomType: "",
    price: "",
    maxGuests: "",
    bedType: "",
    amenities: [] as string[],
    numberOfBeds: "1",
    roomSizeSqm: ""
  });

  // Bed type defaults and constraints
  const bedTypeDefaults: Record<string, { defaultBeds: number; min: number; max: number }> = {
    single: { defaultBeds: 1, min: 1, max: 2 },
    double: { defaultBeds: 1, min: 1, max: 2 },
    queen: { defaultBeds: 1, min: 1, max: 2 },
    king: { defaultBeds: 1, min: 1, max: 2 },
    twin: { defaultBeds: 2, min: 2, max: 4 },
    bunk: { defaultBeds: 2, min: 2, max: 4 }
  };

  // Fetch rooms on mount
  useEffect(() => {
    fetchRooms();
    fetchArchivedRooms();
  }, []);

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem('hotel_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/rooms?status=active`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Unable to load rooms');
      setRooms(data.data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load rooms');
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedRooms = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/rooms?status=archived`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Unable to load archived rooms');
      setArchivedRooms(data.data);
    } catch (err) {
      console.error('Failed to fetch archived rooms:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unable to load archived rooms');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleAddAmenity = () => {
    const amenity = newAmenity.trim();
    if (!amenity) return;
    setFormData(prev => prev.amenities.includes(amenity)
      ? prev
      : { ...prev, amenities: [...prev.amenities, amenity] });
    setNewAmenity('');
  };

  const handleImageSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validImages = files.filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024);

    if (files.length !== validImages.length) {
      setErrorMessage('Please select image files no larger than 10MB each.');
      setTimeout(() => setErrorMessage(null), 5000);
    }
    if (pendingImages.length + validImages.length > 10) {
      setErrorMessage('You can upload up to 10 images when creating a room.');
      setTimeout(() => setErrorMessage(null), 5000);
      return;
    }
    setPendingImages((current) => [...current, ...validImages]);
    event.target.value = '';
  };

  const removePendingImage = (index: number) => {
    setPendingImages((current) => current.filter((_, imageIndex) => imageIndex !== index));
  };

  const uploadRoomImages = async (roomId: string, images: File[]) => {
    if (images.length === 0) return;
    const formData = new FormData();
    images.forEach((image) => formData.append('images', image));
    const response = await fetch(`${API_URL}/admin/rooms/${roomId}/images`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data?.error || 'Room was created, but the images could not be uploaded.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      roomName: formData.roomName,
      roomType: formData.roomType === "__new" ? formData.newRoomType : formData.roomType,
      price: Number(formData.price),
      maxGuests: Number(formData.maxGuests),
      bedType: formData.bedType,
      numberOfBeds: Number(formData.numberOfBeds),
      roomSizeSqm: Number(formData.roomSizeSqm || 0),
      amenities: formData.amenities,
      // Each room type receives one unit automatically. Existing units are retained on edit.
      units: editingRoomId ? editingUnits : [{ unitNumber: '1' }]
    };

    try {
      const url = editingRoomId 
        ? `${API_URL}/admin/rooms/${editingRoomId}`
        : `${API_URL}/admin/rooms`;
      const method = editingRoomId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Failed to ${editingRoomId ? 'update' : 'create'} room`);

      if (!editingRoomId && pendingImages.length > 0) {
        await uploadRoomImages(data.data.id, pendingImages);
      }
      
      setShowForm(false);
      setEditingRoomId(null);
      setEditingRoomImages([]);
      setEditingUnits([]);
      setNewAmenity('');
      setSuccessMessage(`Room ${editingRoomId ? 'updated' : 'created'} successfully${pendingImages.length > 0 && !editingRoomId ? ' with images' : ''}!`);
      setPendingImages([]);
      setFormData({
        roomName: '', roomType: '', newRoomType: '', price: '', maxGuests: '', bedType: '',
        amenities: [], numberOfBeds: '1', roomSizeSqm: ''
      });
      setTimeout(() => setSuccessMessage(null), 3000);
      await fetchRooms();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error creating/updating room');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRoomId(null);
    setEditingRoomImages([]);
    setEditingUnits([]);
    setNewAmenity('');
    setPendingImages([]);
    setFormData({
      roomName: "",
      roomType: "",
      newRoomType: "",
      price: "",
      maxGuests: "",
      bedType: "",
      amenities: [] as string[],
      numberOfBeds: "1",
      roomSizeSqm: ""
    });
  };

  const handleEditRoom = (room: any) => {
    setEditingRoomId(room.id);
    setEditingRoomImages(room.images || []);
    setEditingUnits(room.units || []);
    setFormData({
      roomName: room.roomName,
      roomType: room.roomType,
      newRoomType: "",
      price: String(room.price),
      maxGuests: String(room.maxGuests),
      bedType: room.bedType,
      amenities: room.amenities || [],
      numberOfBeds: String(room.numberOfBeds || 1),
      roomSizeSqm: String(room.roomSizeSqm || 0)
    });
    setPendingImages([]);
    setShowForm(true);
  };

  const handleImagesUpdatedInForm = async () => {
    if (!editingRoomId) return;
    try {
      const res = await fetch(`${API_URL}/admin/rooms/${editingRoomId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || 'Unable to refresh room images');
      setEditingRoomImages(data.data.images || []);
      await fetchRooms();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to refresh room images');
    }
  };

  const handleArchiveRoom = (roomId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Archive Room',
      message: 'Are you sure you want to archive this room? It will be moved to the archived section.',
      variant: 'warning',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/admin/rooms/${roomId}/archive`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
          });
          const data = await res.json();
          
          if (data.ok) {
            setSuccessMessage('Room archived successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            fetchRooms();
            fetchArchivedRooms();
          }
        } catch (err) {
          console.error('Archive error:', err);
          setErrorMessage('Failed to archive room');
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    });
  };

  const handleRestoreRoom = (roomId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Restore Room',
      message: 'Are you sure you want to restore this room? It will be moved back to active rooms.',
      variant: 'info',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/admin/rooms/${roomId}/restore`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
          });
          const data = await res.json();
          
          if (data.ok) {
            setSuccessMessage('Room restored successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            fetchRooms();
            fetchArchivedRooms();
          }
        } catch (err) {
          console.error('Restore error:', err);
          setErrorMessage('Failed to restore room');
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Room Permanently',
      message: 'This will permanently delete the room and all its units. This action cannot be undone. Are you absolutely sure?',
      variant: 'danger',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_URL}/admin/rooms/${roomId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
          });
          const data = await res.json();
          
          if (data.ok) {
            setSuccessMessage('Room deleted successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
            fetchRooms();
            fetchArchivedRooms();
          } else {
            setErrorMessage(data.error || 'Failed to delete room');
            setTimeout(() => setErrorMessage(null), 5000);
          }
        } catch (err) {
          console.error('Delete error:', err);
          setErrorMessage('Failed to delete room');
          setTimeout(() => setErrorMessage(null), 5000);
        }
      }
    });
  };

  const handleManageImages = (room: any) => {
    setSelectedRoomForImages(room);
    setShowImageModal(true);
  };

  const handleCloseImageModal = () => {
    setShowImageModal(false);
    setSelectedRoomForImages(null);
    fetchRooms(); // Refresh rooms to get updated images
  };

  // Get unique room types and bed types for filters
  const uniqueRoomTypes = Array.from(new Set(rooms.map(r => r.roomType)));
  const uniqueBedTypes = Array.from(new Set(rooms.map(r => r.bedType)));

  // Filter rooms based on search and filters
  const filteredRooms = rooms.filter((room) => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      room.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.id?.toLowerCase().includes(searchTerm.toLowerCase());

    // Room type filter
    const matchesType = filterType === "all" || room.roomType === filterType;

    // Bed type filter
    const matchesBedType = filterBedType === "all" || room.bedType === filterBedType;

    // Price range filter
    const minPrice = priceRange.min === "" ? 0 : Number(priceRange.min);
    const maxPrice = priceRange.max === "" ? Infinity : Number(priceRange.max);
    const matchesPrice = room.price >= minPrice && room.price <= maxPrice;

    return matchesSearch && matchesType && matchesBedType && matchesPrice;
  });

  // Filter archived rooms
  const filteredArchivedRooms = archivedRooms.filter((room) => {
    return searchTerm === "" || 
      room.roomName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className={styles.container}>
      {successMessage && <div className={styles.successAlert}>✓ {successMessage}</div>}
      {errorMessage && <div className={styles.errorAlert}>⚠️ {errorMessage}</div>}
      
      <div className={styles.headerBar}>
        <h1 className={styles.title}>Manage Rooms</h1>
        <button className={styles.addButton} onClick={() => {
          handleCancel();
          setShowForm(true);
        }}>+ Add Room</button>
      </div>

      {/* Overlay Form */}
      {showForm && (
        <div className={styles.overlay}>
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <h2 className={styles.formTitle}>
                {editingRoomId ? 'Edit Room' : 'Add New Room'}
              </h2>
              <button 
                className={styles.closeFormBtn} 
                onClick={handleCancel}
                type="button"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className={styles.form}>
              
              {/* Room Name/Label */}
              <div className={styles.formGroup}>
                <label>Room Name/Label</label>
                <input
                  type="text"
                  name="roomName"
                  value={formData.roomName}
                  onChange={handleInputChange}
                  placeholder="e.g., Deluxe King Sea View"
                />
              </div>

              {/* Room Type + Add New */}
              <div className={styles.formGroup}>
                <label>Room Type *</label>
                <select
                  name="roomType"
                  value={formData.roomType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Room Type</option>
                  <option value="standard">Standard</option>
                  <option value="deluxe">Deluxe</option>
                  <option value="suite">Suite</option>
                  <option value="presidential">Presidential Suite</option>
                  <option value="__new">+ Add new type...</option>
                </select>
              </div>

              {formData.roomType === "__new" && (
                <div className={styles.formGroup}>
                  <label>New Room Type *</label>
                  <input
                    type="text"
                    name="newRoomType"
                    value={formData.newRoomType}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Family Suite"
                  />
                </div>
              )}

              {/* Price */}
              <div className={styles.formGroup}>
                <label>Price per Night *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="e.g., 180.00"
                />
              </div>

              {/* Max Guests */}
              <div className={styles.formGroup}>
                <label>Max Guests *</label>
                <input
                  type="number"
                  name="maxGuests"
                  value={formData.maxGuests}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="e.g., 2"
                />
              </div>

              {/* Bed Type */}
              <div className={styles.formGroup}>
                <label>Bed Type *</label>
                <select
                  name="bedType"
                  value={formData.bedType}
                  onChange={(e) => {
                    handleInputChange(e);
                    const bt = e.target.value;
                    const defaults = bedTypeDefaults[bt] || { defaultBeds: 1, min: 1, max: 4 };
                    setFormData(prev => ({ ...prev, numberOfBeds: String(defaults.defaultBeds) }));
                  }}
                  required
                >
                  <option value="">Select Bed Type</option>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="queen">Queen</option>
                  <option value="king">King</option>
                  <option value="twin">Twin</option>
                  <option value="bunk">Bunk</option>
                </select>
              </div>

              {/* Number of Beds (correlates with bed type) */}
              <div className={styles.formGroup}>
                <label>Beds per Unit *</label>
                <input
                  type="number"
                  name="numberOfBeds"
                  value={formData.numberOfBeds}
                  onChange={handleInputChange}
                  required
                  min={(bedTypeDefaults[formData.bedType]?.min ?? 1)}
                  max={(bedTypeDefaults[formData.bedType]?.max ?? 4)}
                  step="1"
                  placeholder="e.g., 1"
                />
                <small>
                  Suggested for {formData.bedType || 'selected type'}:{" "}
                  {(bedTypeDefaults[formData.bedType]?.defaultBeds ?? 1)} bed(s)
                </small>
              </div>

              {/* Amenities */}
              <div className={styles.formGroup}>
                <label>Amenities</label>
                <div className={styles.amenitiesGrid}>
                  {[...new Set(["WiFi", "Bathtub", "Hairdrier", "Electric Kettle", "Mini Bar", "Room Service", "Toiletries", "Air Conditioning", "Smart TV", ...formData.amenities])].map(amenity => (
                    <label key={amenity} className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityChange(amenity)}
                      />
                      {amenity}
                    </label>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <input
                    type="text"
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAmenity();
                      }
                    }}
                    placeholder="Add a custom amenity"
                  />
                  <button type="button" onClick={handleAddAmenity}>Add amenity</button>
                </div>
              </div>

              {!editingRoomId && (
                <div className={styles.formGroup}>
                  <label htmlFor="room-images">Room Images (optional)</label>
                  <input
                    id="room-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    onChange={handleImageSelection}
                  />
                  <small>Choose up to 10 JPG, PNG, WEBP, or GIF images (10MB each). They upload when you save the room.</small>
                  {pendingImages.length > 0 && (
                    <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                      {pendingImages.map((image, index) => (
                        <li key={`${image.name}-${index}`} style={{ marginBottom: 4 }}>
                          {image.name}
                          <button type="button" onClick={() => removePendingImage(index)} style={{ marginLeft: 8 }}>
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {editingRoomId && (
                <div className={styles.formGroup}>
                  <RoomImageUpload
                    roomId={editingRoomId}
                    currentImages={editingRoomImages}
                    onUploadSuccess={handleImagesUpdatedInForm}
                  />
                </div>
              )}

              {/* Form Actions */}
              <div className={styles.formActions}>
                <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : editingRoomId ? 'Update Room' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <section className={styles.filterSection}>
        <div className={styles.filterRow}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Types</option>
            {uniqueRoomTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <select 
            value={filterBedType} 
            onChange={(e) => setFilterBedType(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Bed Types</option>
            {uniqueBedTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          <div className={styles.priceRange}>
            <input
              type="number"
              placeholder="Min"
              value={priceRange.min}
              onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
              className={styles.priceInput}
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange.max}
              onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
              className={styles.priceInput}
            />
          </div>

          <button 
            className={styles.clearFilters}
            onClick={() => {
              setSearchTerm("");
              setFilterType("all");
              setFilterBedType("all");
              setPriceRange({ min: "", max: "" });
            }}
          >
            Clear
          </button>

          <div className={styles.resultCount}>
            {filteredRooms.length} of {rooms.length}
          </div>
        </div>
      </section>

      {/* Published Rooms */}
      <section className={styles.section}>
        <h3 className={styles.subtitle}>Published Rooms</h3>
        {loading ? (
          <p>Loading rooms...</p>
        ) : filteredRooms.length === 0 ? (
          <p>{rooms.length === 0 ? 'No rooms yet. Click "Add Room" to create one.' : 'No rooms match your filters.'}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Room ID</th>
                <th>Room Name</th>
                <th>Room Type</th>
                <th>Units</th>
                <th>Price/Night</th>
                <th>Max Guests</th>
                <th>Size (sqm)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRooms.map((room) => (
                <tr key={room.id}>
                  <td>#{room.id.slice(0, 8)}</td>
                  <td>{room.roomName}</td>
                  <td>{room.roomType}</td>
                  <td>{room.units?.length || 0}</td>
                  <td>${room.price}</td>
                  <td>{room.maxGuests}</td>
                  <td>{room.roomSizeSqm}</td>
                  <td>
                    <button className={styles.editBtn} onClick={() => handleEditRoom(room)}>
                      Edit
                    </button>
                    <button className={styles.imagesBtn} onClick={() => handleManageImages(room)}>
                      Images
                    </button>
                    <button className={styles.archiveBtn} onClick={() => handleArchiveRoom(room.id)}>
                      Archive
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Archived Rooms */}
      <section className={styles.section}>
        <h3 className={styles.subtitle}>Archived Rooms</h3>
        {filteredArchivedRooms.length === 0 ? (
          <p>{archivedRooms.length === 0 ? 'No archived rooms.' : 'No archived rooms match your search.'}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Room ID</th>
                <th>Room Name</th>
                <th>Room Type</th>
                <th>Units</th>
                <th>Price/Night</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArchivedRooms.map((room) => (
                <tr key={room.id}>
                  <td>#{room.id.slice(0, 8)}</td>
                  <td>{room.roomName}</td>
                  <td>{room.roomType}</td>
                  <td>{room.units?.length || 0}</td>
                  <td>${room.price}</td>
                  <td><span className={`${styles.statusBadge} ${styles.archived}`}>Archived</span></td>
                  <td>
                    <button className={styles.restoreBtn} onClick={() => handleRestoreRoom(room.id)}>
                      Restore
                    </button>
                    <button className={styles.deleteBtn} onClick={() => handleDeleteRoom(room.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* Image Management Modal */}
      {showImageModal && selectedRoomForImages && (
        <div className={styles.overlay}>
          <div className={styles.imageModalContainer}>
            <div className={styles.imageModalHeader}>
              <h2>Manage Images - {selectedRoomForImages.roomName}</h2>
              <button 
                className={styles.closeBtn} 
                onClick={handleCloseImageModal}
              >
                ×
              </button>
            </div>
            <div className={styles.imageModalContent}>
              <RoomImageUpload
                roomId={selectedRoomForImages.id}
                currentImages={selectedRoomForImages.images || []}
                onUploadSuccess={handleCloseImageModal}
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        confirmText={confirmDialog.variant === 'danger' ? 'Delete' : 'Confirm'}
      />
    </div>
  );
};
