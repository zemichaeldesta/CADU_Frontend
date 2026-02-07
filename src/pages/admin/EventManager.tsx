import React, { useEffect, useState } from 'react';
import { cmsAPI, Event, Image } from '../../api/cms';
import { useToast } from '../../context/ToastContext';
import AdminLayout from '../../components/AdminLayout';
import '../../components/AdminLayout.css';

const EventManager: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    title_en: '',
    title_am: '',
    description_en: '',
    description_am: '',
    start_date: '',
    end_date: '',
    location: '',
    event_type: 'regular' as 'regular' | 'member',
    image_id: '',
    is_published: false,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [eventsData, imagesData] = await Promise.all([
        cmsAPI.getAdminEvents(),
        cmsAPI.getImages(),
      ]);
      setEvents(eventsData.results);
      setImages(imagesData.results);
    } catch (error) {
      console.error('Failed to load data:', error);
      showError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title_en: '',
      title_am: '',
      description_en: '',
      description_am: '',
      start_date: '',
      end_date: '',
      location: '',
      event_type: 'regular' as 'regular' | 'member',
      image_id: '',
      is_published: false,
    });
    setEditingEvent(null);
    setShowCreate(false);
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      title_en: event.title_en || '',
      title_am: event.title_am || '',
      description_en: event.description_en || '',
      description_am: event.description_am || '',
      start_date: event.start_date ? new Date(event.start_date).toISOString().slice(0, 16) : '',
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      event_type: event.event_type || 'regular',
      image_id: event.image?.id?.toString() || '',
      is_published: event.is_published || false,
    });
    setShowCreate(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData: any = {
        ...formData,
        image_id: formData.image_id ? parseInt(formData.image_id) : null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
      };

      if (editingEvent) {
        await cmsAPI.updateEvent(editingEvent.id, submitData);
        showSuccess('Event updated successfully!');
      } else {
        await cmsAPI.createEvent(submitData);
        showSuccess('Event created successfully!');
      }
      resetForm();
      loadData();
    } catch (error: any) {
      console.error('Failed to save event:', error);
      showError(error.response?.data?.detail || error.response?.data || 'Failed to save event. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await cmsAPI.deleteEvent(id);
      loadData();
      showSuccess('Event deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete event:', error);
      showError(error.response?.data?.detail || 'Failed to delete event. Please try again.');
    }
  };

  const togglePublish = async (event: Event) => {
    try {
      await cmsAPI.updateEvent(event.id, { ...event, is_published: !event.is_published });
      loadData();
      showSuccess(`Event ${!event.is_published ? 'published' : 'unpublished'} successfully!`);
    } catch (error: any) {
      console.error('Failed to toggle publish:', error);
      showError('Failed to update event. Please try again.');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Event Manager" subtitle="Manage events and meetings">
        <div className="admin-loading">Loading...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Event Manager"
      subtitle="Manage events and meetings"
      actionButton={
        <button onClick={() => setShowCreate(!showCreate)} className="new-button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          {showCreate ? 'Cancel' : 'Create Event'}
        </button>
      }
    >

      {showCreate && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
            {editingEvent ? 'Edit Event' : 'Create New Event'}
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Title (English) *</label>
                <input
                  type="text"
                  value={formData.title_en}
                  onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Title (Amharic)</label>
                <input
                  type="text"
                  value={formData.title_am}
                  onChange={(e) => setFormData({ ...formData, title_am: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Description (English)</label>
                <textarea
                  value={formData.description_en}
                  onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="form-group">
                <label>Description (Amharic)</label>
                <textarea
                  value={formData.description_am}
                  onChange={(e) => setFormData({ ...formData, description_am: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Image</label>
                <select
                  value={formData.image_id}
                  onChange={(e) => setFormData({ ...formData, image_id: e.target.value })}
                >
                  <option value="">None</option>
                  {images.map((img) => (
                    <option key={img.id} value={img.id}>
                      {img.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Event Type *</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({ ...formData, event_type: e.target.value as 'regular' | 'member' })}
                  required
                >
                  <option value="regular">Regular Event</option>
                  <option value="member">Member Event</option>
                </select>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => {
                      e.stopPropagation();
                      setFormData({ ...formData, is_published: e.target.checked });
                    }}
                  />
                  Published
                </label>
              </div>
            </div>
            <button type="submit" className="submit-btn">
              {editingEvent ? 'Update Event' : 'Create Event'}
            </button>
          </form>
        </div>
      )}

      <h2 className="section-title">Events</h2>
      {events.length === 0 ? (
        <div className="empty-state">
          <p>No events found. Create your first event above.</p>
        </div>
      ) : (
        <div className="events-list">
          {events.map((event) => (
            <div key={event.id} className="event-item">
              <div className="event-info">
                <div className="event-title">{event.title_en || event.title_am}</div>
                <div className="event-meta">
                  {new Date(event.start_date).toLocaleDateString()} • {event.location || 'No location'}
                  <span className="status-badge" style={{ marginLeft: '0.5rem', background: event.event_type === 'member' ? '#e9d5ff' : '#3498db', color: event.event_type === 'member' ? '#6b21a8' : '#ffffff' }}>
                    {event.event_type === 'member' ? 'Member Event' : 'Regular Event'}
                  </span>
                  {event.is_published && (
                    <span className={`status-badge ${event.is_published ? 'published' : 'draft'}`} style={{ marginLeft: '0.5rem' }}>
                      {event.is_published ? 'Published' : 'Draft'}
                    </span>
                  )}
                </div>
              </div>
              <div className="action-buttons">
                <button onClick={() => handleEdit(event)} className="action-btn edit">
                  Edit
                </button>
                <button onClick={() => togglePublish(event)} className="action-btn">
                  {event.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button onClick={() => handleDelete(event.id)} className="action-btn delete">
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default EventManager;

