import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { cmsAPI, Event } from '../api/cms';
import DetailModal from '../components/DetailModal';
import './News.css';

// Helper function to strip HTML tags and get plain text
const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Helper function to truncate text (handles HTML content)
const truncateText = (text: string, maxLength: number): { truncated: string; isTruncated: boolean } => {
  const plainText = stripHtml(text);
  if (plainText.length <= maxLength) {
    return { truncated: text, isTruncated: false };
  }
  // If it's HTML, we need to be careful - just show plain text truncated
  return { truncated: plainText.substring(0, maxLength), isTruncated: true };
};

const Events: React.FC = () => {
  const { language } = useLanguage();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const eventsData = await cmsAPI.getEvents({ 
          ordering: 'start_date',
          event_type: 'regular'
        });
        setEvents(eventsData.results);
      } catch (error) {
        console.error('Failed to load events:', error);
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
        <h1>{language === 'am' ? 'ዝግጅቶች' : 'Events'}</h1>
        
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
                          {(() => {
                            const { truncated, isTruncated } = truncateText(description, 150);
                            if (isTruncated) {
                              return (
                                <>
                                  {truncated}
                                  {' '}
                                  <button
                                    className="read-more-link"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEvent(event);
                                    }}
                                  >
                                    {language === 'am' ? 'ተጨማሪ ያንብቡ' : 'Read more'}
                                  </button>
                                </>
                              );
                            }
                            return <span dangerouslySetInnerHTML={{ __html: description }} />;
                          })()}
                        </p>
                      )}
                      {event.event_type === 'member' && (
                        <p className="event-member-tag">
                          <span>Members only event</span>
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <p>{language === 'am' ? 'እስካሁን ምንም ዝግጅቶች አልተገኙም።' : 'No events found.'}</p>
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
            {selectedEvent.event_type === 'member' && (
              <span>👥 Members only event</span>
            )}
          </div>
        </DetailModal>
      )}
    </div>
  );
};

export default Events;

