import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { cmsAPI, Event } from '../api/cms';
import DetailModal from '../components/DetailModal';
import './News.css';

const MemberEvents: React.FC = () => {
  const { language } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsData = await cmsAPI.getEvents({ 
          ordering: 'start_date',
          event_type: 'member'
        });
        setEvents(eventsData.results);
      } catch (error) {
        console.error('Failed to load member events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="news-page">
      <div className="container">
        <h1>{language === 'am' ? 'የአባላት ዝግጅቶች' : 'Member Events'}</h1>
        
        {events.length > 0 ? (
          <section className="events-section">
            <div className="events-grid">
              {events.map((event) => {
                const title = language === 'am' && event.title_am ? event.title_am : event.title_en;
                const description = language === 'am' && event.description_am ? event.description_am : event.description_en || '';
                
                return (
                  <article 
                    key={event.id} 
                    className="event-card"
                    onClick={() => setSelectedEvent(event)}
                    style={{ cursor: 'pointer' }}
                  >
                    {event.image && (
                      <div className="event-image">
                        <img src={event.image.image} alt={event.image.alt_text || title} />
                      </div>
                    )}
                    <div className="event-content">
                      <h3>{title}</h3>
                      <div className="event-meta">
                        {event.start_date && (
                          <span className="event-date">
                            {new Date(event.start_date).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        )}
                        {event.location && (
                          <span className="event-location">{event.location}</span>
                        )}
                      </div>
                      {description && (
                        <p className="event-description">
                          {description.length > 150 ? `${description.substring(0, 150)}...` : description}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <p>{language === 'am' ? 'እስካሁን ምንም የአባላት ዝግጅቶች አልተገኙም።' : 'No member events found.'}</p>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <DetailModal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={language === 'am' && selectedEvent.title_am ? selectedEvent.title_am : selectedEvent.title_en}
          image={selectedEvent.image}
        >
          <p dangerouslySetInnerHTML={{ 
            __html: language === 'am' && selectedEvent.description_am 
              ? selectedEvent.description_am 
              : selectedEvent.description_en || '' 
          }} />
          <div className="detail-meta">
            {selectedEvent.start_date && (
              <span>📅 {new Date(selectedEvent.start_date).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            )}
            {selectedEvent.end_date && (
              <span>📅 Ends: {new Date(selectedEvent.end_date).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            )}
            {selectedEvent.location && <span>📍 {selectedEvent.location}</span>}
            <span>👥 Members only event</span>
          </div>
        </DetailModal>
      )}
    </div>
  );
};

export default MemberEvents;

